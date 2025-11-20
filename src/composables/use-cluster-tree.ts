// 集群资源树管理 Composable
// 提供统一的树节点状态管理和数据加载逻辑

import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { clusterApi } from '@/api/clusters'
import { useAccountStore } from '@/stores/accounts'
import { useClusterStore } from '@/stores/clusters'
import JetStreamErrorHandler, { type AccountErrorInfo } from '@/utils/jetstream-error-handler'
import type {
  TreeNode,
  JetStreamAccountInfo,
  StreamInfo,
  Account,
  Cluster,
  JetStreamDetectionResponse,
} from '@/types'

export function useClusterTree(clusterId: string, clusterFromRoute?: Cluster) {
  const accountStore = useAccountStore()
  const clusterStore = useClusterStore()

  // 如果从路由传入了集群对象，先放入 store
  if (clusterFromRoute && !clusterStore.clusters.find((c) => c.id === clusterFromRoute.id)) {
    clusterStore.clusters.push(clusterFromRoute)
  }

  // 状态管理
  const treeNodes = ref<TreeNode[]>([])
  const selectedNode = ref<TreeNode | null>(null)
  const loading = ref(false)
  const loadingProgress = ref(0)
  const errors = ref<Map<string, AccountErrorInfo>>(new Map())
  const pendingRequests = ref<Set<string>>(new Set())

  // 缓存机制 - 存储已加载的账户数据，避免重复请求
  const accountCache = ref<Map<string, { data: JetStreamAccountInfo; timestamp: number }>>(
    new Map()
  )
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存过期时间

  // 计算属性
  const accountStats = computed(() => {
    const nonSystemAccounts = accountStore.accounts.filter((account) => !account.is_system_account)
    const systemAccounts = accountStore.accounts.filter((account) => account.is_system_account)

    // 从树节点中统计JetStream启用的账户
    const accountNodes = treeNodes.value[0]?.children || []
    const jetStreamEnabledCount = accountNodes.filter(
      (node: TreeNode) => node.jetStreamEnabled
    ).length

    return {
      total: nonSystemAccounts.length,
      jetStreamEnabled: jetStreamEnabledCount,
      active: nonSystemAccounts.filter((a) => a.status === 'active').length,
      system: systemAccounts.length,
    }
  })

  // 初始化树数据
  const initializeTree = async () => {
    try {
      loading.value = true
      loadingProgress.value = 0

      // 步骤1: 只加载集群信息，不加载账户列表
      loadingProgress.value = 50

      // 如果没有从路由传入集群对象且 store 中找不到当前集群，则通过 ID 获取
      if (!clusterFromRoute && !clusterStore.clusters.find((c) => c.id === clusterId)) {
        await clusterStore.fetchCluster(clusterId)
      }

      // 步骤2: 构建只有集群节点的树结构（不包含账户子节点）
      loadingProgress.value = 80
      const clusterNode = buildClusterNodeWithoutAccounts()
      treeNodes.value = [clusterNode]

      loadingProgress.value = 100
      console.log('集群资源树初始化完成，账户列表将在点击集群节点时加载')
    } catch (error) {
      console.error('Failed to initialize cluster tree:', error)
      ElMessage.error('初始化集群资源树失败')
    } finally {
      loading.value = false
      loadingProgress.value = 0
    }
  }

  // 账户可展开性预检测（使用Detection接口）
  const checkAccountsExpandability = async () => {
    const accountNodes = getAccountNodes()
    const validAccounts = accountNodes.filter(
      (node) => node.public_key && !node.is_system_account && node.status === 'active'
    )

    if (validAccounts.length === 0) {
      console.warn('No valid accounts found for expandability check')
      return
    }

    console.log(
      `Checking expandability for ${validAccounts.length} accounts using detection endpoint...`
    )

    // 并发检测所有账户的可展开性
    const expandabilityPromises = validAccounts.map(async (accountNode) => {
      try {
        const response: JetStreamDetectionResponse = await clusterApi.getClusterJetStreamDetection(
          clusterId,
          accountNode.public_key,
          10000
        )

        const hasStreams = response.streams > 0
        const jetStreamEnabled = hasStreams

        console.log(`Account ${accountNode.name} detection result:`, {
          jetStreamEnabled,
          hasStreams,
          streams: response.streams,
          fullResponse: response,
        })

        return {
          accountId: accountNode.id,
          expandable: hasStreams,
          jetStreamEnabled: jetStreamEnabled,
          detectionData: response,
        }
      } catch (error: any) {
        console.warn(
          `Failed to check expandability for account ${accountNode.name}:`,
          error.message
        )
        return {
          accountId: accountNode.id,
          expandable: true,
          jetStreamEnabled: true,
          error: error.message,
        }
      }
    })

    const results = await Promise.allSettled(expandabilityPromises)

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const accountNode = findNodeById(result.value.accountId)
        if (accountNode) {
          accountNode.expandable = result.value.expandable
          accountNode.jetStreamEnabled = result.value.jetStreamEnabled
          accountNode.detectionData = result.value.detectionData

          console.log(
            `Account ${accountNode.name}: expandable=${result.value.expandable}, jetStreamEnabled=${result.value.jetStreamEnabled}`
          )

          if (result.value.error) {
            console.warn(`Account ${accountNode.name} check had error: ${result.value.error}`)
          }
        }
      } else {
        console.error(`Failed to check account expandability:`, result.reason)
      }
    })

    const expandableCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.expandable
    ).length

    console.log(
      `Expandability check completed: ${expandableCount}/${validAccounts.length} accounts are expandable`
    )
  }

  // 构建集群节点（不包含账户列表）
  const buildClusterNodeWithoutAccounts = (): TreeNode => {
    // 获取当前集群信息
    const currentCluster = clusterStore.clusters.find((c) => c.id === clusterId)

    console.log('Building cluster node without accounts:', {
      clusterId,
      currentCluster: currentCluster ? { id: currentCluster.id, name: currentCluster.name } : null,
    })

    const clusterName = currentCluster?.name || '未知集群'
    const clusterStatus = currentCluster?.status || 'disabled'

    return {
      id: `cluster_${clusterId}`,
      label: clusterName,
      type: 'cluster',
      name: clusterName,
      status: clusterStatus,
      clusterId: clusterId,
      clusterInfo: currentCluster,
      children: [], // 初始为空，点击时再加载
    }
  }

  // 加载账户列表
  const loadAccountsList = async () => {
    try {
      loading.value = true
      console.log('开始加载账户列表...')

      // 加载账户和用户数据
      await Promise.all([accountStore.fetchAccounts({ page_size: 10000 })])

      // 构建账户节点
      const clusterNode = treeNodes.value[0]
      if (clusterNode) {
        const nonSystemAccounts = accountStore.accounts.filter(
          (account) => !account.is_system_account
        )

        const accountNodes: TreeNode[] = nonSystemAccounts.map((account) => ({
          id: `account_${account.id}`,
          label: account.name,
          type: 'account',
          name: account.name,
          status: account.status,
          is_system_account: account.is_system_account,
          public_key: account.public_key,
          accountId: account.id,
          jetStreamEnabled: false,
          expandable: null,
          children: [],
          loading: false,
        }))

        clusterNode.children = accountNodes
        console.log(`账户列表加载完成，共 ${accountNodes.length} 个账户`)
      }
    } catch (error) {
      console.error('Failed to load accounts list:', error)
      ElMessage.error('加载账户列表失败')
    } finally {
      loading.value = false
    }
  }

  // 构建集群节点
  const buildClusterNode = (): TreeNode => {
    const nonSystemAccounts = accountStore.accounts.filter((account) => !account.is_system_account)

    const accountNodes: TreeNode[] = nonSystemAccounts.map((account) => ({
      id: `account_${account.id}`,
      label: account.name,
      type: 'account',
      name: account.name,
      status: account.status,
      is_system_account: account.is_system_account,
      public_key: account.public_key,
      jetStreamEnabled: false, // 将被后续加载更新
      expandable: null, // null表示未检测，true/false表示检测结果
      children: [],
      loading: false,
    }))

    // 获取当前集群信息
    const currentCluster = clusterStore.clusters.find((c) => c.id === clusterId)

    // 调试信息
    console.log('Building cluster node:', {
      clusterId,
      availableClusters: clusterStore.clusters.map((c) => ({ id: c.id, name: c.name })),
      currentCluster: currentCluster ? { id: currentCluster.id, name: currentCluster.name } : null,
    })

    const clusterName = currentCluster?.name || '未知集群'
    const clusterStatus = currentCluster?.status || 'disabled'

    return {
      id: `cluster_${clusterId}`,
      label: clusterName,
      type: 'cluster',
      name: clusterName,
      status: clusterStatus,
      clusterId: clusterId,
      clusterInfo: currentCluster,
      children: accountNodes,
    }
  }

  // 更新单个账户节点 - 合并列表和详情API的数据
  const updateAccountNode = (accountId: string, accountInfo: JetStreamAccountInfo) => {
    const accountNode = findNodeById(accountId)
    if (!accountNode) return

    // 更新账户节点属性
    accountNode.jetStreamEnabled = accountInfo.jetstream_enabled
    accountNode.loading = false
    accountNode.stats = accountInfo.stats

    // 构建JetStream子节点 - 安全处理null/undefined的streams
    const streams = accountInfo.streams || []

    // 如果有raw_data中的原始流信息，合并到streams中
    if (accountInfo.raw_data?.account_details) {
      const accountDetails = Array.isArray(accountInfo.raw_data.account_details)
        ? accountInfo.raw_data.account_details
        : [accountInfo.raw_data.account_details]

      accountDetails.forEach((detail) => {
        if (detail.stream_detail && Array.isArray(detail.stream_detail)) {
          detail.stream_detail.forEach((rawStream) => {
            // 查找是否已经存在对应的stream
            const existingStream = streams.find((s) => s.name === rawStream.config?.name)

            if (existingStream) {
              // 合并详情数据
              existingStream.cluster = rawStream.cluster
              existingStream.created = rawStream.created
              existingStream.ts = rawStream.ts
              // 合并配置信息，优先使用详情接口的数据
              existingStream.config = { ...existingStream.config, ...rawStream.config }
              existingStream.state = { ...existingStream.state, ...rawStream.state }
            } else if (rawStream.config?.name) {
              // 创建新的stream节点，基于raw_data的详情信息
              streams.push({
                name: rawStream.config.name,
                config: rawStream.config,
                state: rawStream.state,
                cluster: rawStream.cluster,
                created: rawStream.created,
                ts: rawStream.ts,
                status: 'active', // 假设活跃状态
              })
            }
          })
        }
      })
    }

    // 如果有original_streams数据，也进行合并
    if (
      accountInfo.raw_data?.original_streams &&
      Array.isArray(accountInfo.raw_data.original_streams)
    ) {
      accountInfo.raw_data.original_streams.forEach((originalStream) => {
        const existingStream = streams.find((s) => s.name === originalStream.config?.name)

        if (existingStream) {
          // 合并原始流数据
          existingStream.cluster = originalStream.cluster
          existingStream.created = originalStream.created
          existingStream.ts = originalStream.ts
          existingStream.config = { ...existingStream.config, ...originalStream.config }
          existingStream.state = { ...existingStream.state, ...originalStream.state }
        } else if (originalStream.config?.name) {
          streams.push({
            name: originalStream.config.name,
            config: originalStream.config,
            state: originalStream.state,
            cluster: originalStream.cluster,
            created: originalStream.created,
            ts: originalStream.ts,
            status: 'active',
          })
        }
      })
    }

    // 构建树节点
    accountNode.children = streams.map((stream) => buildStreamNode(stream))

    console.log(`Updated account ${accountInfo.account_name}:`, {
      enabled: accountInfo.jetstream_enabled,
      streamsCount: streams.length,
      mergedStreams: streams.map((s) => ({
        name: s.name,
        hasCluster: !!s.cluster,
        hasState: !!s.state,
      })),
    })
  }

  // 构建流节点
  const buildStreamNode = (stream: StreamInfo): TreeNode => ({
    id: `jetstream_${stream.name}`,
    label: stream.name,
    type: 'jetstream',
    name: stream.name,
    status: stream.status,
    config: stream.config,
    state: stream.state,
    error: stream.error,
    created_at: stream.created_at,
    cluster: stream.cluster,
    created: stream.created,
    ts: stream.ts,
    children: [],
  })

  // 从字符串数组更新账户节点（新API返回值格式）
  const updateAccountNodeFromStreamNames = (accountId: string, streamNames: string[]) => {
    const accountNode = findNodeById(accountId)
    if (!accountNode) return

    // 更新账户节点属性
    accountNode.jetStreamEnabled = streamNames.length > 0
    accountNode.expandable = streamNames.length > 0
    accountNode.loading = false

    // 构建简单的JetStream子节点（只有名称）
    accountNode.children = streamNames.map((streamName) => ({
      id: `jetstream_${streamName}`,
      label: streamName,
      type: 'jetstream',
      name: streamName,
      status: 'active',
    }))

    console.log(`Updated account ${accountNode.name}:`, {
      jetStreamEnabled: accountNode.jetStreamEnabled,
      streamCount: streamNames.length,
      streams: streamNames,
    })
  }

  // 单个账户JetStream信息懒加载（带缓存）- 使用Actuality接口获取真实数据
  const loadAccountJetStreamInfo = async (accountNode: TreeNode) => {
    if (!accountNode.accountId) {
      console.warn('Account node missing accountId:', accountNode)
      const errorInfo = JetStreamErrorHandler.handleAccountError('账户ID缺失', accountNode.name)
      errors.value.set(accountNode.id, errorInfo)
      return
    }

    const requestKey = accountNode.id
    const cacheKey = `${clusterId}_${accountNode.accountId}`

    // 检查缓存
    const cached = accountCache.value.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`使用缓存数据: ${accountNode.name}`)
      updateAccountNodeFromStreamNames(accountNode.id, cached.data as unknown as string[])
      return
    }

    // 防止重复请求
    if (pendingRequests.value.has(requestKey)) {
      console.log(`懒加载请求进行中: ${accountNode.name}`)
      return
    }

    try {
      pendingRequests.value.add(requestKey)
      accountNode.loading = true
      errors.value.delete(requestKey)

      console.log(
        `开始懒加载 ${accountNode.name} (accountId: ${accountNode.accountId}) 的JetStream信息 - 使用actuality接口`
      )

      // 使用Actuality接口获取JetStream名称列表（字符串数组）
      const streamNames = await clusterApi.getClusterJetStreamInfo(
        clusterId,
        accountNode.accountId,
        10000
      )

      console.log(`账户 ${accountNode.name} JetStream信息加载完成:`, {
        streamCount: streamNames.length,
        streams: streamNames,
      })

      // 成功加载，更新缓存和节点数据
      accountCache.value.set(cacheKey, {
        data: streamNames as unknown as JetStreamAccountInfo,
        timestamp: Date.now(),
      })
      updateAccountNodeFromStreamNames(accountNode.id, streamNames)
      console.log(`账户 ${accountNode.name} 数据更新成功并已缓存`)
    } catch (error: any) {
      // 单个账户错误隔离处理
      console.error(`账户 ${accountNode.name} 懒加载失败（错误已隔离）:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })

      const errorInfo = JetStreamErrorHandler.handleAccountError(error, accountNode.name)
      errors.value.set(requestKey, errorInfo)

      // 提取错误信息：优先使用处理后的友好信息，如果没有则使用原始错误
      let errorMessage = errorInfo.message
      
      // 如果有更详细的错误信息，将其附加到消息中
      if (error.response?.data?.error) {
        const backendError = error.response.data.error
        // 如果后端错误包含更具体的信息（如账户ID），使用它
        if (backendError.includes('账户') && backendError.includes('ac_')) {
          errorMessage = backendError
        }
      }
      
      // 添加建议操作
      if (errorInfo.suggestion) {
        errorMessage = `${errorMessage}。${errorInfo.suggestion}`
      }

      // 只显示当前账户的错误，不影响整个页面
      ElMessage({
        message: `账户 ${accountNode.name}: ${errorMessage}`,
        type: JetStreamErrorHandler.getElementMessageType(errorInfo.severity),
        duration: 8000,
        showClose: true,
      })
    } finally {
      accountNode.loading = false
      pendingRequests.value.delete(requestKey)
    }
  }

  // 加载JetStream详情（点击jetstream节点时）
  const loadJetStreamDetail = async (jetstreamNode: TreeNode) => {
    try {
      loading.value = true
      console.log(`开始加载JetStream详情: ${jetstreamNode.name}`)

      const parentAccount = findParentAccount(jetstreamNode.id)
      if (!parentAccount?.accountId) {
        console.error('无法找到父账户信息')
        ElMessage.error('无法加载JetStream详情：父账户信息缺失')
        return
      }

      // 并行调用详情接口和consumers接口
      const [detailData, consumersData] = await Promise.all([
        clusterApi.getClusterJetStreamInfoDetailed(
          clusterId,
          parentAccount.accountId,
          jetstreamNode.name
        ),
        clusterApi.getClusterJetStreamConsumers(clusterId, jetstreamNode.name),
      ])

      console.log(`JetStream ${jetstreamNode.name} 详情加载完成:`, detailData)
      console.log(`JetStream ${jetstreamNode.name} consumers加载完成:`, consumersData)

      const updatedNode = findNodeById(jetstreamNode.id)
      if (updatedNode) {
        updatedNode.config = detailData.config
        updatedNode.state = detailData.state
        updatedNode.cluster = detailData.cluster
        updatedNode.created = detailData.created
        updatedNode.ts = detailData.ts

        // 如果有consumers，挂载为子节点
        if (consumersData.consumers && consumersData.consumers.length > 0) {
          updatedNode.children = consumersData.consumers.map((consumerName) => ({
            id: `consumer_${consumerName}`,
            label: consumerName,
            type: 'consumer',
            name: consumerName,
            jetstreamName: jetstreamNode.name,
            status: 'active',
          }))
        } else {
          updatedNode.children = []
        }

        selectedNode.value = { ...updatedNode }
      }
    } catch (error: any) {
      console.error(`加载JetStream详情失败:`, error)
      ElMessage.error(`加载JetStream详情失败: ${error.message || '未知错误'}`)
    } finally {
      loading.value = false
    }
  }

  // 节点点击处理（懒加载核心逻辑）
  const handleNodeClick = async (nodeData: TreeNode) => {
    try {
      // 清空当前选择
      selectedNode.value = null
      await nextTick()

      // 设置新选择
      selectedNode.value = { ...nodeData }

      // 懒加载逻辑：点击集群节点时先加载账户列表，再检测账户可展开性
      if (nodeData.type === 'cluster') {
        const accountNodes = getAccountNodes()

        // 如果账户列表还未加载（children为空），先加载账户列表
        if (accountNodes.length === 0) {
          console.log('首次点击集群节点，开始加载账户列表')
          await loadAccountsList()
        }

        // 检查是否需要检测账户可展开性
        const updatedAccountNodes = getAccountNodes()
        const needsCheck = updatedAccountNodes.some((node) => node.expandable === null)

        if (needsCheck) {
          console.log('开始检测账户可展开性')
          await checkAccountsExpandability()
        }
      }

      // 懒加载逻辑：只有当用户点击账户节点时才加载JetStream信息
      if (nodeData.type === 'account') {
        // 检查是否已经加载过数据（避免重复加载）
        if (!nodeData.children || nodeData.children.length === 0) {
          // 检查是否可展开
          if (nodeData.expandable === false) {
            console.log(`账户 ${nodeData.name} 不可展开，无JetStream数据`)
            return
          }

          // 执行懒加载
          console.log(`懒加载账户 ${nodeData.name} 的JetStream信息`)
          await loadAccountJetStreamInfo(nodeData)

          // 加载完成后，从树中获取更新后的节点数据并更新selectedNode
          const updatedNode = findNodeById(nodeData.id)
          if (updatedNode) {
            selectedNode.value = { ...updatedNode }
          }
        } else {
          console.log(`账户 ${nodeData.name} 的数据已缓存，跳过加载`)
        }
      }

      // 点击JetStream节点时加载详情
      if (nodeData.type === 'jetstream') {
        if (!nodeData.config || !nodeData.state) {
          console.log(`懒加载JetStream ${nodeData.name} 的详细信息`)
          await loadJetStreamDetail(nodeData)
        } else {
          console.log(`JetStream ${nodeData.name} 的详细信息已缓存`)
        }
      }

      // 点击Consumer节点 - 不需要在这里处理，由页面组件的watch处理
      if (nodeData.type === 'consumer') {
        console.log(`选中Consumer ${nodeData.name}`)
      }
    } catch (error) {
      console.error('Error handling node click:', error)
      ElMessage.error('处理节点点击时出错')
    }
  }

  // 刷新JetStream信息（强制重新加载）
  const refreshJetStreamInfo = async () => {
    if (!selectedNode.value) return

    if (selectedNode.value.type === 'account') {
      // 清除缓存，强制重新加载
      const cacheKey = `${clusterId}_${selectedNode.value.accountId}`
      accountCache.value.delete(cacheKey)
      console.log(`清除账户 ${selectedNode.value.name} 的缓存，强制刷新`)

      await loadAccountJetStreamInfo(selectedNode.value)

      // 刷新完成后，从树中获取更新后的节点数据并更新selectedNode
      const updatedNode = findNodeById(selectedNode.value.id)
      if (updatedNode) {
        selectedNode.value = { ...updatedNode }
      }
    } else if (selectedNode.value.type === 'jetstream') {
      // 找到父账户并刷新
      const parentAccount = findParentAccount(selectedNode.value.id)
      if (parentAccount) {
        // 清除父账户缓存
        const cacheKey = `${clusterId}_${parentAccount.accountId}`
        accountCache.value.delete(cacheKey)
        console.log(`清除父账户 ${parentAccount.name} 的缓存，刷新流信息`)

        await loadAccountJetStreamInfo(parentAccount)
        // 更新选中的流节点
        const updatedStream = parentAccount.children?.find(
          (child) => child.id === selectedNode.value?.id
        )
        if (updatedStream) {
          selectedNode.value = { ...updatedStream }
        }
      }
    }
  }

  // 缓存管理方法
  const clearCache = () => {
    accountCache.value.clear()
    console.log('已清空所有缓存')
  }

  const clearAccountCache = (accountPublicKey: string) => {
    const cacheKey = `${clusterId}_${accountPublicKey}`
    accountCache.value.delete(cacheKey)
    console.log(`已清空账户 ${accountPublicKey} 的缓存`)
  }

  // 工具方法
  const getAccountNodes = (): TreeNode[] => {
    return treeNodes.value[0]?.children || []
  }

  const findNodeById = (nodeId: string): TreeNode | null => {
    const findInNodes = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node
        if (node.children) {
          const found = findInNodes(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findInNodes(treeNodes.value)
  }

  const findParentAccount = (streamId: string): TreeNode | null => {
    const accountNodes = getAccountNodes()
    return (
      accountNodes.find((account) => account.children?.some((child) => child.id === streamId)) ||
      null
    )
  }

  const getNodeError = (nodeId: string): AccountErrorInfo | null => {
    return errors.value.get(nodeId) || null
  }

  const clearNodeError = (nodeId: string) => {
    errors.value.delete(nodeId)
  }

  return {
    // 状态
    treeNodes,
    selectedNode,
    loading,
    loadingProgress,
    errors,
    accountStats,

    // 核心方法
    initializeTree,
    handleNodeClick,
    refreshJetStreamInfo,
    loadAccountJetStreamInfo,

    // 错误处理
    getNodeError,
    clearNodeError,

    // 缓存管理
    clearCache,
    clearAccountCache,

    // 工具方法
    findNodeById,
    findParentAccount,
  }
}

<template>
  <div class="cluster-management">
    <div class="header">
      <div class="title">
        <h2>集群管理</h2>
        <p>管理和监控NATS集群基础设施</p>
      </div>
      <div class="actions">
        <el-button @click="viewClusterTopology">
          <el-icon><Share /></el-icon>
          查看拓扑
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增集群
        </el-button>
      </div>
    </div>

    <!-- 集群统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon size="24"><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">活跃集群</div>
                <div class="stat-value">{{ activeClustersCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon size="24"><Monitor /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">总集群数</div>
                <div class="stat-value">{{ totalClustersCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card clickable" @click="handleNavigateToMonitoring">
            <div class="stat-content">
              <div class="stat-icon warning">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">异常集群</div>
                <div class="stat-value">{{ abnormalClustersCount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon sync">
                <el-icon size="24"><Refresh /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">同步任务</div>
                <div class="stat-value">0</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 集群卡片列表 -->
    <div v-loading="clusterStore.loading" class="cluster-cards">
      <el-empty
        v-if="clusterStore.clusters.length === 0"
        description="暂无集群数据"
        :image-size="200"
      >
        <el-button type="primary" @click="handleCreate">创建集群</el-button>
      </el-empty>
      <el-row :gutter="24" v-else>
        <el-col
          v-for="cluster in clusterStore.clusters"
          :key="cluster.id"
          :lg="8"
          :md="12"
          :sm="24"
          class="cluster-col"
        >
          <el-card class="cluster-card" :class="{ disabled: cluster.status === 'disabled' }">
            <!-- 卡片头部 -->
            <template #header>
              <div class="card-header">
                <div class="cluster-info">
                  <div class="cluster-title-line">
                    <div
                      class="cluster-name"
                      :class="{ 'clickable-title': cluster.host && cluster.monitor_port }"
                      @click="handleTitleClick(cluster)"
                    >
                      <el-icon class="cluster-icon"><Monitor /></el-icon>
                      <span>{{ cluster.name }}</span>
                    </div>
                    <el-tag
                      :type="cluster.status === 'active' ? 'success' : 'danger'"
                      size="small"
                      class="status-tag"
                    >
                      {{ cluster.status === 'active' ? '活跃' : '禁用' }}
                    </el-tag>
                    <!-- Network Status Indicator -->
                    <el-tag
                      :type="getNetworkStatusType(cluster.id)"
                      size="small"
                      class="network-status-tag"
                      effect="plain"
                    >
                      <el-icon class="network-status-icon">
                        <component :is="getNetworkStatusIcon(cluster.id)" />
                      </el-icon>
                      {{ getNetworkStatusText(cluster.id) }}
                    </el-tag>
                  </div>
                  <div class="cluster-description">
                    <span>{{ cluster.description || '暂无描述' }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 卡片内容 -->
            <div class="card-content">
              <!-- 连接信息 -->
              <div class="connection-info">
                <div class="connection-item">
                  <el-icon class="connection-icon"><Link /></el-icon>
                  <span class="connection-label">主机</span>
                  <el-tooltip
                    :content="cluster.host || 'N/A'"
                    placement="top"
                    :disabled="!cluster.host || cluster.host.length <= 25"
                  >
                    <span class="connection-value host-value">
                      {{ cluster.host || 'N/A' }}
                    </span>
                  </el-tooltip>
                </div>

                <div class="connection-item">
                  <el-icon class="connection-icon"><Connection /></el-icon>
                  <span class="connection-label">端口</span>
                  <div class="ports-tags">
                    <el-tag type="primary" size="small" class="port-tag">
                      {{ cluster.nats_port || 4222 }}
                    </el-tag>
                    <el-tag type="success" size="small" class="port-tag">
                      {{ cluster.gateway_port || 7222 }}
                    </el-tag>
                    <el-tag type="warning" size="small" class="port-tag">
                      {{ cluster.monitor_port || 8222 }}
                    </el-tag>
                    <el-tag type="info" size="small" class="port-tag">
                      {{ cluster.cluster_port || 6222 }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <!-- 系统配置 -->
              <div class="system-info">
                <div class="connection-item">
                  <el-icon class="connection-icon"><User /></el-icon>
                  <span class="connection-label">系统账户</span>
                  <span class="connection-value">{{
                    getAccountName(cluster.system_account_id)
                  }}</span>
                </div>

                <div class="connection-item">
                  <el-icon class="connection-icon"><Calendar /></el-icon>
                  <span class="connection-label">创建时间</span>
                  <span class="connection-value">{{
                    dayjs(cluster.created_at).format('YYYY-MM-DD')
                  }}</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="action-buttons">
                <el-button
                  type="success"
                  size="small"
                  @click="handleTestConnection(cluster)"
                  :loading="testingCluster === cluster.id"
                  plain
                >
                  <el-icon><Connection /></el-icon>
                  测试连接
                </el-button>
                <el-button type="primary" size="small" @click="handleViewCluster(cluster)" plain>
                  <el-icon><Right /></el-icon>
                  查看详情
                </el-button>
                <el-button type="info" size="small" @click="handleEdit(cluster)" plain>
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>

              <!-- 查看节点列表按钮 -->
              <div class="expand-nodes-section">
                <el-button
                  :type="expandedClusterId === cluster.id ? 'warning' : 'info'"
                  size="small"
                  @click="toggleClusterNodes(cluster)"
                  :loading="loadingClusters.has(cluster.id)"
                  plain
                  class="expand-btn"
                >
                  <el-icon><Monitor /></el-icon>
                  {{ expandedClusterId === cluster.id ? '关闭节点列表' : '查看节点列表' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 节点列表展示区域 -->
    <div v-if="expandedClusterId" class="nodes-section">
      <el-card shadow="never" class="nodes-card">
        <div class="nodes-header">
          <div class="nodes-title">
            <el-icon><Monitor /></el-icon>
            <span>{{ getExpandedClusterName() }} - 节点列表</span>
            <el-tag size="small" type="info"
              >{{ getClusterNodes(expandedClusterId)?.length || 0 }} 个节点</el-tag
            >
          </div>
          <div class="nodes-actions">
            <el-button
              size="small"
              @click="refreshClusterNodes(expandedClusterId)"
              :loading="loadingClusters.has(expandedClusterId)"
              type="primary"
              plain
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" @click="closeClusterNodes" type="default">
              <el-icon><Close /></el-icon>
              关闭
            </el-button>
          </div>
        </div>

        <div class="nodes-content">
          <div v-if="loadingClusters.has(expandedClusterId)" class="loading-content">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="getClusterNodes(expandedClusterId)?.length" class="nodes-table">
            <el-table :data="getClusterNodes(expandedClusterId)" size="default" stripe>
              <el-table-column prop="server.name" label="节点名称" min-width="200">
                <template #default="{ row }">
                  <div class="node-name">
                    <el-icon class="node-icon"><Monitor /></el-icon>
                    <span>{{ row.server.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="getNodeStatus(row) === 'normal' ? 'success' : 'danger'"
                    size="default"
                    effect="dark"
                  >
                    {{ getNodeStatus(row) === 'normal' ? '🟢 正常' : '🔴 异常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="statsz.connections"
                label="连接数"
                width="120"
                align="center"
              />
              <el-table-column
                prop="statsz.subscriptions"
                label="订阅数"
                width="120"
                align="center"
              />
              <el-table-column label="消息发送" width="120" align="center">
                <template #default="{ row }">
                  {{ formatNumber(row.statsz.sent.msgs) }}
                </template>
              </el-table-column>
              <el-table-column label="消息接收" width="120" align="center">
                <template #default="{ row }">
                  {{ formatNumber(row.statsz.received.msgs) }}
                </template>
              </el-table-column>
              <el-table-column label="Leader" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="isLeader(row)" type="warning" size="default" effect="dark">
                    ⭐ Leader
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="API错误" width="100" align="center">
                <template #default="{ row }">
                  <el-text
                    :type="
                      (row.statsz.jetstream?.stats?.api?.errors || 0) > 0 ? 'danger' : 'success'
                    "
                  >
                    {{ row.statsz.jetstream?.stats?.api?.errors || 0 }}
                  </el-text>
                </template>
              </el-table-column>
              <el-table-column prop="server.ver" label="版本" width="120" align="center" />
              <el-table-column prop="server.host" label="主机地址" min-width="160" />
            </el-table>
          </div>
          <div v-else class="empty-nodes">
            <el-empty description="暂无节点数据" :image-size="80" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 连接测试结果对话框 -->
    <el-dialog v-model="testResultVisible" title="连接测试结果" width="600px">
      <div v-if="testResult">
        <el-result
          :icon="testResult.status === 'success' ? 'success' : 'error'"
          :title="testResult.status === 'success' ? '连接成功' : '连接失败'"
          :sub-title="testResult.message || testResult.error"
        >
          <template #extra>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="集群名称">{{
                testResult.cluster_name
              }}</el-descriptions-item>
              <el-descriptions-item label="NATS地址">{{ testResult.url }}</el-descriptions-item>
              <el-descriptions-item label="测试时间">{{
                dayjs(testResult.tested_at).format('YYYY-MM-DD HH:mm:ss')
              }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-result>
      </div>
    </el-dialog>

    <!-- 集群拓扑对话框 -->
    <el-dialog
      v-model="topologyDialogVisible"
      title="集群拓扑结构"
      width="60%"
      class="topology-dialog"
    >
      <div v-if="clusterTopologyData" class="topology-content">
        <!-- 精简的统计信息 -->
        <div class="topology-header">
          <div class="topology-stats-compact">
            <div class="stat-item">
              <span class="stat-label">总集群:</span>
              <span class="stat-value">{{ clusterTopologyData.total_clusters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已组网:</span>
              <span class="stat-value connected">{{ clusterTopologyData.connected_clusters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">孤立:</span>
              <span class="stat-value isolated">{{ clusterTopologyData.isolated_count }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">超级集群组:</span>
              <span class="stat-value">{{ clusterTopologyData.super_cluster_count }}</span>
            </div>
          </div>
        </div>

        <!-- 拓扑可视化图表 -->
        <ClusterTopologyChart :topology-data="clusterTopologyData" />

        <!-- 可选的详细信息 -->
        <el-collapse v-model="debugCollapseActive" class="details-info">
          <el-collapse-item title="查看详细连接信息" name="details">
            <div class="details-content">
              <div v-if="clusterTopologyData.super_cluster_groups.length > 0" class="group-details">
                <div
                  v-for="group in clusterTopologyData.super_cluster_groups"
                  :key="group.group_id"
                  class="group-detail"
                >
                  <h5>{{ group.group_name }}</h5>
                  <div class="connections-summary">
                    <div
                      v-for="conn in group.connections"
                      :key="`${conn.from_cluster_id}-${conn.to_cluster_id}`"
                      class="connection-detail"
                    >
                      {{ conn.from_cluster_name }} → {{ conn.to_cluster_name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Monitor,
  Connection,
  Warning,
  Refresh,
  Link,
  Calendar,
  User,
  Edit,
  DocumentCopy,
  Share,
  CircleClose,
  Upload,
  Download,
  Right,
  ArrowUp,
  ArrowDown,
  Close,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useClusterStore } from '@/stores/clusters'
import { useAccountStore } from '@/stores/accounts'
import { clusterApi } from '@/api/clusters'
import ClusterTopologyChart from '@/components/ClusterTopologyChart.vue'
import type {
  Cluster,
  ClusterTestResult,
  ClusterMonitoringDashboardResponse,
  ClusterTopologyResponse,
  ClusterServersResponse,
  ClusterServer,
} from '@/types'

const router = useRouter()
const clusterStore = useClusterStore()
const accountStore = useAccountStore()

const testingCluster = ref<string | null>(null)
const testResultVisible = ref(false)
const testResult = ref<ClusterTestResult | null>(null)
const monitoringDashboard = ref<ClusterMonitoringDashboardResponse | null>(null)

// Real cluster topology data from API
const clusterTopologyData = ref<ClusterTopologyResponse | null>(null)
const topologyDialogVisible = ref(false)
const debugCollapseActive = ref<string[]>([])

// 节点列表相关状态
const expandedClusterId = ref<string | null>(null)
const loadingClusters = ref<Set<string>>(new Set())
const clusterNodesData = ref<ClusterServer[]>([])

// 统计计算属性
const activeClustersCount = computed(
  () => clusterStore.clusters.filter((c) => c.status === 'active').length
)

const totalClustersCount = computed(() => clusterStore.clusters.length)

const disabledClustersCount = computed(
  () => clusterStore.clusters.filter((c) => c.status === 'disabled').length
)

const abnormalClustersCount = computed(
  () => monitoringDashboard.value?.stats?.unhealthy_clusters || 0
)

onMounted(() => {
  fetchClusters()
  fetchMonitoringDashboard()
  fetchClusterTopology()
  accountStore.fetchAccounts() // 加载账户数据用于显示系统账户名称
})

const fetchClusters = () => {
  clusterStore.fetchClusters()
}

const fetchMonitoringDashboard = async () => {
  try {
    monitoringDashboard.value = await clusterApi.getMonitoringDashboard()
  } catch (error) {
    console.error('Failed to fetch monitoring dashboard:', error)
    // 如果获取失败，不显示错误消息，只是默认为0
  }
}

const fetchClusterTopology = async () => {
  try {
    clusterTopologyData.value = await clusterApi.getClusterTopology()
  } catch (error) {
    console.error('Failed to fetch cluster topology:', error)
    // 如果获取失败，不显示错误消息，使用默认值
  }
}

const handleCreate = () => {
  router.push('/clusters/create')
}

const handleNavigateToMonitoring = () => {
  router.push('/clusters/monitoring')
}

const handleEdit = (cluster: Cluster) => {
  router.push(`/clusters/${cluster.id}/edit`)
}

const handleViewCluster = (cluster: Cluster) => {
  router.push({
    path: `/clusters/${cluster.id}/detail`,
    state: { cluster }
  })
}

const handleTestConnection = async (cluster: Cluster) => {
  testingCluster.value = cluster.id
  try {
    const result = await clusterStore.testClusterConnection(cluster.id)
    testResult.value = result
    testResultVisible.value = true
  } catch (error) {
    console.error('Test connection failed:', error)
  } finally {
    testingCluster.value = null
  }
}

// 获取账户名称
const getAccountName = (accountId?: string) => {
  if (!accountId) return 'N/A'
  const account = accountStore.accounts.find((a) => a.id === accountId)
  return account?.name || 'Unknown'
}

// 获取集群NATS URL
const getClusterNATSURL = (cluster: any) => {
  if (!cluster || !cluster.host) return 'N/A'
  const port = cluster.nats_port || 4222
  return `nats://${cluster.host}:${port}`
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 格式化NATS地址显示
const formatNatsAddress = (cluster?: any) => {
  if (!cluster || !cluster.host) return 'N/A'

  const port = cluster.nats_port || 4222
  return `${cluster.host}:${port}`
}

// 获取集群主机地址
const getClusterHost = (cluster?: any) => {
  if (!cluster) return 'N/A'
  return cluster.host || 'N/A'
}

// 获取集群端口配置
const getClusterPorts = (cluster?: any) => {
  if (!cluster || !cluster.host) return 'N/A'

  const natsPort = cluster.nats_port || 4222
  const gatewayPort = cluster.gateway_port || 7222
  const monitorPort = cluster.monitor_port || 8222
  const clusterPort = cluster.cluster_port || 6222
  return `NATS:${natsPort}/网关:${gatewayPort}/监控:${monitorPort}/集群:${clusterPort}`
}

// 获取集群组网状态相关方法 - 使用真实API数据
const getClusterTopologyNode = (clusterId: string) => {
  if (!clusterTopologyData.value) return null

  // 在超级集群组中查找
  for (const group of clusterTopologyData.value.super_cluster_groups) {
    const node = group.clusters.find((c) => c.cluster_id === clusterId)
    if (node) return node
  }

  // 在孤立集群中查找
  const isolatedNode = clusterTopologyData.value.isolated_clusters.find(
    (c) => c.cluster_id === clusterId
  )
  if (isolatedNode) return isolatedNode

  return null
}

const getNetworkStatusType = (clusterId: string) => {
  const node = getClusterTopologyNode(clusterId)
  if (!node) return 'info'

  switch (node.connection_status) {
    case 'connected':
      return 'success'
    case 'isolated':
      return 'danger'
    default:
      return 'info'
  }
}

const getNetworkStatusIcon = (clusterId: string) => {
  const node = getClusterTopologyNode(clusterId)
  if (!node) return 'CircleClose'

  switch (node.connection_status) {
    case 'connected':
      return 'Share'
    case 'isolated':
      return 'CircleClose'
    default:
      return 'CircleClose'
  }
}

const getNetworkStatusText = (clusterId: string) => {
  const node = getClusterTopologyNode(clusterId)
  if (!node) return '未知'

  switch (node.connection_status) {
    case 'connected':
      return '已组网'
    case 'isolated':
      return '孤立'
    default:
      return '未知'
  }
}

const viewClusterTopology = async () => {
  try {
    // Refresh topology data
    await fetchClusterTopology()

    if (clusterTopologyData.value) {
      topologyDialogVisible.value = true
      ElMessage.success(`获取到 ${clusterTopologyData.value.total_clusters} 个集群的拓扑信息`)
    } else {
      ElMessage.warning('未获取到拓扑数据')
    }
  } catch (error) {
    console.error('Failed to get cluster topology:', error)
    ElMessage.error('获取集群拓扑失败')
  }
}

const getClusterStatusClass = (status: string) => {
  switch (status) {
    case 'connected':
      return 'connected'
    case 'isolated':
      return 'isolated'
    default:
      return 'unknown'
  }
}

// 处理标题点击事件，打开监控页面
const handleTitleClick = (cluster: Cluster) => {
  if (!cluster.host || !cluster.monitor_port) {
    return
  }
  const monitorUrl = `http://${cluster.host}:${cluster.monitor_port}`
  window.open(monitorUrl, '_blank')
}

// 节点列表相关函数
const toggleClusterNodes = async (cluster: Cluster) => {
  if (expandedClusterId.value === cluster.id) {
    // 收起
    expandedClusterId.value = null
    clusterNodesData.value = []
  } else {
    // 展开新的集群，自动关闭之前的
    expandedClusterId.value = cluster.id
    await loadClusterNodes(cluster.id)
  }
}

const closeClusterNodes = () => {
  expandedClusterId.value = null
  clusterNodesData.value = []
}

const getExpandedClusterName = (): string => {
  if (!expandedClusterId.value) return ''
  const cluster = clusterStore.clusters.find((c) => c.id === expandedClusterId.value)
  return cluster?.name || '未知集群'
}

const loadClusterNodes = async (clusterId: string) => {
  loadingClusters.value.add(clusterId)
  try {
    const response = await clusterApi.getClusterServers(clusterId)
    clusterNodesData.value = response.servers
  } catch (error) {
    console.error('Failed to load cluster nodes:', error)
    ElMessage.error('获取集群节点信息失败')
    clusterNodesData.value = []
  } finally {
    loadingClusters.value.delete(clusterId)
  }
}

const refreshClusterNodes = async (clusterId: string) => {
  await loadClusterNodes(clusterId)
}

const getClusterNodes = (clusterId: string): ClusterServer[] => {
  return clusterNodesData.value
}

const getNodeStatus = (node: ClusterServer): 'normal' | 'abnormal' => {
  const hasConnections = node.statsz.connections > 0
  const hasNoApiErrors =
    !node.statsz.jetstream?.stats?.api?.errors || node.statsz.jetstream.stats.api.errors === 0
  return hasConnections && hasNoApiErrors ? 'normal' : 'abnormal'
}

const isLeader = (node: ClusterServer): boolean => {
  const leaderName = node.statsz.jetstream?.meta?.leader
  return !!leaderName && leaderName === node.server.name
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
</script>

<style scoped lang="scss">
.cluster-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .title h2 {
    margin: 0 0 4px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .title p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}

// 统计概览样式
.stats-overview {
  margin-bottom: 24px;

  .stat-card {
    border: 1px solid var(--el-border-color-lighter);

    :deep(.el-card__body) {
      padding: 20px;
    }

    &.clickable {
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: var(--el-color-primary);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.active {
      background: linear-gradient(135deg, #67c23a, #85ce61);
    }

    &.total {
      background: linear-gradient(135deg, #409eff, #79bbff);
    }

    &.warning {
      background: linear-gradient(135deg, #f56c6c, #f89898);
    }

    &.sync {
      background: linear-gradient(135deg, #e6a23c, #eebe77);
    }
  }

  .stat-info {
    flex: 1;
  }

  .stat-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

// 集群卡片样式
.cluster-cards {
  .cluster-col {
    margin-bottom: 24px;
  }

  .cluster-card {
    height: 100%;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    &.disabled {
      opacity: 0.7;

      :deep(.el-card__header) {
        background-color: var(--el-fill-color-light);
      }
    }

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cluster-info {
    flex: 1;
  }

  .cluster-title-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .cluster-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    flex: 1;
    min-width: 0;

    &.clickable-title {
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    .cluster-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .cluster-description {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 1.3;
  }

  .status-tag {
    font-size: 12px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .network-status-tag {
    font-size: 11px;
    flex-shrink: 0;
    margin-left: 4px;

    .network-status-icon {
      margin-right: 2px;
      font-size: 10px;
    }
  }

  .card-content {
    .connection-info,
    .system-info {
      margin-bottom: 16px;
    }

    .connection-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .connection-icon {
        color: var(--el-color-primary);
        font-size: 14px;
        flex-shrink: 0;
      }

      .connection-label {
        color: var(--el-text-color-regular);
        min-width: 50px;
        flex-shrink: 0;
        font-size: 13px;
      }

      .connection-value {
        color: var(--el-text-color-primary);
        font-weight: 500;
        flex: 1;
        min-width: 0;

        &.host-value {
          font-family: monospace;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
          cursor: help;
        }
      }
    }

    .ports-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .port-tag {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
        font-weight: 500;
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);

      .el-button {
        flex: 1;
        font-size: 12px;
      }
    }

    .expand-nodes-section {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);

      .expand-btn {
        width: 100%;
        font-size: 12px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
        }
      }
    }
  }
}

// 拓扑对话框样式
.topology-dialog {
  .topology-content {
    .topology-header {
      background: var(--el-fill-color-extra-light);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid var(--el-border-color-lighter);
    }

    .topology-stats-compact {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;

        .stat-label {
          color: var(--el-text-color-regular);
          font-weight: 500;
        }

        .stat-value {
          font-weight: 600;
          font-size: 16px;
          color: var(--el-text-color-primary);

          &.connected {
            color: var(--el-color-success);
          }

          &.isolated {
            color: var(--el-color-danger);
          }
        }
      }
    }

    .details-info {
      .details-content {
        .group-details {
          .group-detail {
            margin-bottom: 16px;
            padding: 12px;
            background: var(--el-fill-color-extra-light);
            border-radius: 6px;

            h5 {
              margin: 0 0 8px 0;
              color: var(--el-text-color-primary);
              font-size: 14px;
            }

            .connections-summary {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;

              .connection-detail {
                background: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                color: var(--el-text-color-regular);
                border: 1px solid var(--el-border-color-lighter);
              }
            }
          }
        }
      }
    }
  }
}

// 节点列表展示区域样式
.nodes-section {
  margin-top: 24px;
  animation: slideDown 0.3s ease-out;

  .nodes-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 20px;
    }

    .nodes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--el-border-color-lighter);

      .nodes-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        font-size: 16px;
        color: var(--el-text-color-primary);

        .el-icon {
          color: var(--el-color-primary);
          font-size: 18px;
        }

        .el-tag {
          margin-left: 12px;
        }
      }

      .nodes-actions {
        display: flex;
        gap: 12px;
      }
    }

    .nodes-content {
      .loading-content {
        padding: 40px;
        text-align: center;
      }

      .nodes-table {
        .node-name {
          display: flex;
          align-items: center;
          gap: 8px;

          .node-icon {
            color: var(--el-color-primary);
            font-size: 16px;
          }
        }

        :deep(.el-table) {
          .el-table__header-wrapper {
            .el-table__header {
              th {
                background: var(--el-fill-color-light);
                color: var(--el-text-color-primary);
                font-weight: 600;
                font-size: 14px;
              }
            }
          }

          .el-table__body-wrapper {
            .el-table__row {
              &:hover > td {
                background: var(--el-fill-color-extra-light);
              }
            }
          }
        }
      }

      .empty-nodes {
        padding: 40px;
        text-align: center;
        background: var(--el-fill-color-extra-light);
        border-radius: 6px;
      }
    }
  }
}

// 动画定义
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 1000px;
  }
}
</style>

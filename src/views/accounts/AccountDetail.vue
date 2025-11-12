<template>
  <div class="account-detail">
    <div class="page-header">
      <el-button text @click="$router.back()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <p>查看和管理账户的详细信息</p>
    </div>

    <div v-loading="loading">
      <div v-if="account">
        <el-row :gutter="20">
          <!-- 基本信息 -->
          <el-col :span="18">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>账户详情</span>
                  <div class="header-actions">
                    <el-tag :type="account.status === 'active' ? 'success' : 'danger'" size="large">
                      {{ account.status === 'active' ? '活跃' : '禁用' }}
                    </el-tag>
                    <el-tag :type="account.is_system_account ? 'info' : 'warning'" size="large">
                      {{ account.is_system_account ? '系统账户' : '普通账户' }}
                    </el-tag>
                  </div>
                </div>
              </template>

              <el-descriptions :column="2" size="large" border>
                <el-descriptions-item label="账户名称">
                  <div class="name-field">
                    <strong>{{ account.name }}</strong>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="账户ID">
                  <div class="id-field">
                    <code>{{ account.id }}</code>
                    <el-button text size="small" @click="copyToClipboard(account.id)">
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="描述">
                  <div class="description-field">
                    {{ account.description || '无描述' }}
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="所属集群">
                  <div class="cluster-field">
                    <el-tag v-if="getClusterDisplayName(account) !== '缺失'" size="small">
                      {{ getClusterDisplayName(account) }}
                    </el-tag>
                    <span v-else class="no-cluster">缺失</span>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="创建时间">
                  <div class="datetime-field">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(account.created_at) }}
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="更新时间">
                  <div class="datetime-field">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(account.updated_at) }}
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 密钥信息 -->
            <el-card style="margin-top: 24px">
              <template #header>
                <span>密钥信息</span>
              </template>

              <el-descriptions :column="1" size="large" border>
                <el-descriptions-item label="公钥">
                  <div class="key-field">
                    <code class="key-text">{{ account.public_key }}</code>
                    <el-button text size="small" @click="copyToClipboard(account.public_key)">
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="私钥">
                  <div class="key-field">
                    <code class="key-text">{{
                      showPrivateKey ? account.nkey : '••••••••••••••••••••••••••••••••'
                    }}</code>
                    <el-button text size="small" @click="togglePrivateKey">
                      <el-icon><View v-if="!showPrivateKey" /><Hide v-else /></el-icon>
                      {{ showPrivateKey ? '隐藏' : '显示' }}
                    </el-button>
                    <el-button
                      v-if="showPrivateKey"
                      text
                      size="small"
                      @click="copyToClipboard(account.nkey)"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 账户限制信息 -->
            <el-card style="margin-top: 24px" v-if="account.limits && !account.is_system_account">
              <template #header>
                <span>账户限制</span>
              </template>

              <el-descriptions :column="2" size="large" border>
                <el-descriptions-item label="最大连接数">
                  {{ formatLimit(account.limits.max_connections) }}
                </el-descriptions-item>

                <el-descriptions-item label="最大叶节点数">
                  {{ formatLimit(account.limits.max_leaf_nodes) }}
                </el-descriptions-item>

                <el-descriptions-item label="最大数据量">
                  {{
                    formatStorageValue(account.limits.max_data_value, account.limits.max_data_unit)
                  }}
                </el-descriptions-item>

                <el-descriptions-item label="最大载荷">
                  {{
                    formatStorageValue(
                      account.limits.max_payload_value,
                      account.limits.max_payload_unit
                    )
                  }}
                </el-descriptions-item>

                <el-descriptions-item label="最大订阅数">
                  {{ formatLimit(account.limits.max_subscriptions) }}
                </el-descriptions-item>

                <el-descriptions-item label="JetStream状态">
                  <el-tag :type="hasJetStream ? 'success' : 'info'" size="small">
                    {{ hasJetStream ? '已启用' : '未启用' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <!-- JetStream详细信息 -->
              <div v-if="hasJetStream" style="margin-top: 20px">
                <el-divider content-position="left">JetStream配置</el-divider>
                <el-descriptions :column="2" size="default" border>
                  <el-descriptions-item label="内存存储">
                    {{
                      formatStorageValue(
                        account.limits.jetstream_limits?.memory_storage_value,
                        account.limits.jetstream_limits?.memory_storage_unit
                      )
                    }}
                  </el-descriptions-item>

                  <el-descriptions-item label="磁盘存储">
                    {{
                      formatStorageValue(
                        account.limits.jetstream_limits?.disk_storage_value,
                        account.limits.jetstream_limits?.disk_storage_unit
                      )
                    }}
                  </el-descriptions-item>

                  <el-descriptions-item label="最大流数">
                    {{ formatLimit(account.limits.jetstream_limits?.streams) }}
                  </el-descriptions-item>

                  <el-descriptions-item label="最大消费者数">
                    {{ formatLimit(account.limits.jetstream_limits?.consumers) }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>

            <!-- 系统账户说明 -->
            <el-card style="margin-top: 24px" v-if="account.is_system_account">
              <template #header>
                <span>系统账户说明</span>
              </template>
              <el-alert
                title="系统账户特性"
                description="系统账户用于集群内部通信和管理，不允许设置任何限制配置，确保系统服务的稳定运行。"
                type="info"
                show-icon
                :closable="false"
              />
            </el-card>

            <!-- JWT信息 -->
            <el-card style="margin-top: 24px">
              <template #header>
                <div class="card-header">
                  <span>JWT信息</span>
                  <el-button v-if="currentJWT" size="small" @click="copyJWT">
                    <el-icon><DocumentCopy /></el-icon>
                    复制JWT
                  </el-button>
                </div>
              </template>

              <div v-loading="jwtLoading">
                <div v-if="currentJWT" class="jwt-sections">
                  <!-- JWT Token -->
                  <div class="jwt-section">
                    <div class="section-header">
                      <h4>JWT令牌</h4>
                    </div>
                    <div class="jwt-token">
                      <pre>{{ currentJWT.raw_token }}</pre>
                    </div>
                  </div>

                  <!-- Decoded Claims -->
                  <div class="jwt-section" style="margin-top: 20px">
                    <div class="section-header">
                      <h4>解码后的声明 (Claims)</h4>
                    </div>
                    <div class="jwt-claims">
                      <pre
                        class="json-syntax"
                      ><code v-html="formatJSON(currentJWT.claims)"></code></pre>
                    </div>
                  </div>
                </div>

                <div v-else-if="!jwtLoading" class="no-jwt">
                  <el-empty description="JWT信息加载失败" />
                  <el-button @click="loadJWT" style="margin-top: 16px">
                    <el-icon><Refresh /></el-icon>
                    重试加载
                  </el-button>
                </div>
              </div>
            </el-card>

            <!-- Limits Claims信息 -->
            <el-card style="margin-top: 24px" v-if="account.limits">
              <template #header>
                <span>Limits Claims (数据库存储)</span>
              </template>

              <div class="limits-claims">
                <pre class="json-syntax"><code v-html="formatJSON(account.limits)"></code></pre>
              </div>
            </el-card>
          </el-col>

          <!-- 操作面板 -->
          <el-col :span="6">
            <el-card>
              <template #header>
                <span>操作</span>
              </template>

              <div class="action-section">
                <el-button type="primary" @click="editAccount" class="action-button">
                  <el-icon><Edit /></el-icon>
                  编辑账户
                </el-button>

                <el-button @click="viewUsers" class="action-button">
                  <el-icon><Avatar /></el-icon>
                  查看用户
                </el-button>

                <el-button @click="syncJWT" class="action-button">
                  <el-icon><Connection /></el-icon>
                  同步JWT
                </el-button>

                <el-button @click="manageAssociation" class="action-button">
                  <el-icon><Share /></el-icon>
                  数据共享配置
                </el-button>

                <el-divider />

                <el-button
                  v-if="account.status === 'disabled'"
                  type="success"
                  @click="enableAccount"
                  :loading="statusChanging"
                  class="action-button"
                >
                  <el-icon><VideoPlay /></el-icon>
                  启用账户
                </el-button>

                <el-button
                  v-else
                  type="warning"
                  @click="disableAccount"
                  :loading="statusChanging"
                  class="action-button"
                >
                  <el-icon><VideoPause /></el-icon>
                  禁用账户
                </el-button>

                <el-button
                  type="danger"
                  @click="deleteAccount"
                  :loading="deleting"
                  class="action-button danger-button"
                >
                  <el-icon><Delete /></el-icon>
                  删除账户
                </el-button>
              </div>
            </el-card>

            <!-- 快速统计 -->
            <el-card style="margin-top: 24px">
              <template #header>
                <span>相关信息</span>
              </template>

              <div class="stats-section">
                <div class="stat-item">
                  <div class="stat-label">关联用户</div>
                  <div class="stat-value">{{ userCount }} 个</div>
                </div>

                <div class="stat-item">
                  <div class="stat-label">JWT任务</div>
                  <div class="stat-value">{{ jwtTaskCount }} 个</div>
                </div>

                <div class="stat-item">
                  <div class="stat-label">账户状态</div>
                  <div class="stat-value">
                    <el-tag :type="account.status === 'active' ? 'success' : 'danger'" size="small">
                      {{ account.status === 'active' ? '正常运行' : '已禁用' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-else-if="!loading" class="account-not-found">
        <el-empty description="账户未找到" />
      </div>
    </div>

    <!-- 数据共享配置对话框 -->
    <AccountSharingDialog
      v-model="sharingDialogVisible"
      :account-id="account?.id || ''"
      @refresh="handleSharingRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts'
import { useClusterStore } from '@/stores/clusters'
import { accountApi } from '@/api/accounts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime, copyToClipboard } from '@/utils'
import { formatStorage } from '@/utils/storage'
import { AccountStatus } from '@/types'
import {
  ArrowLeft,
  DocumentCopy,
  Calendar,
  View,
  Hide,
  Edit,
  Avatar,
  Key,
  Connection,
  VideoPlay,
  VideoPause,
  Refresh,
  Share,
  Delete,
} from '@element-plus/icons-vue'
import type { Account } from '@/types'
import AccountSharingDialog from '@/components/AccountSharingDialog.vue'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const clusterStore = useClusterStore()

const loading = ref(false)
const statusChanging = ref(false)
const deleting = ref(false)
const showPrivateKey = ref(false)
const jwtLoading = ref(false)
const account = ref<Account | null>(null)
const currentJWT = ref<{ raw_token: string; claims: any } | null>(null)
const userCount = ref(0)
const jwtTaskCount = ref(0)
const sharingDialogVisible = ref(false)

// JSON formatting function for syntax highlighting
const formatJSON = (obj: any) => {
  if (!obj) return ''

  let jsonString = JSON.stringify(obj, null, 2)

  // Apply syntax highlighting with HTML spans
  jsonString = jsonString
    // Highlight object keys first
    .replace(/"([^"]+)"(\s*:\s*)/g, '<span class="json-key">"$1"</span>$2')
    // Highlight string values
    .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    // Highlight numbers (including negative and decimal)
    .replace(/:\s*(-?\d*\.?\d+)([,\s\r\n}])/g, ': <span class="json-number">$1</span>$2')
    // Highlight booleans
    .replace(/:\s*(true|false)([,\s\r\n}])/g, ': <span class="json-boolean">$1</span>$2')
    // Highlight null
    .replace(/:\s*(null)([,\s\r\n}])/g, ': <span class="json-null">$1</span>$2')
    // Highlight structural characters
    .replace(/([{}[\],])/g, '<span class="json-bracket">$1</span>')

  return jsonString
}

const hasJetStream = computed(() => {
  if (!account.value?.limits?.jetstream_limits) return false
  const js = account.value.limits.jetstream_limits
  return (
    js.memory_storage_value > 0 ||
    js.memory_storage_value === -1 ||
    js.disk_storage_value > 0 ||
    js.disk_storage_value === -1 ||
    js.streams > 0 ||
    js.consumers > 0
  )
})

const togglePrivateKey = () => {
  showPrivateKey.value = !showPrivateKey.value
}

const formatLimit = (value: number | undefined) => {
  if (value === undefined) return '-'
  if (value === -1) return '不限'
  if (value === 0) return '0'
  return value.toLocaleString()
}

const formatStorageValue = (value: number | undefined, unit: string | undefined) => {
  if (value === undefined || unit === undefined) return '-'
  return formatStorage(value, unit as any)
}

const getClusterName = (clusterId: string | undefined) => {
  if (!clusterId) return null
  const cluster = clusterStore.clusters.find((c) => c.id === clusterId)
  return cluster ? cluster.name : '未知集群'
}

const getClusterDisplayName = (account: Account) => {
  // 优先使用后端返回的 cluster_name 字段
  if (account.cluster_name) {
    return account.cluster_name
  }
  // 如果 cluster_name 为空，尝试通过 origin_cluster_id 查找
  if (account.origin_cluster_id) {
    const cluster = clusterStore.clusters.find((c) => c.id === account.origin_cluster_id)
    return cluster ? cluster.name : '缺失'
  }
  // 都没有则显示缺失
  return '缺失'
}

const editAccount = () => {
  router.push(`/accounts/${account.value?.id}/edit`)
}

const viewUsers = () => {
  router.push(`/accounts/${account.value?.id}/users`)
}

const viewJWT = () => {
  // JWT already loaded and displayed in the detail view
  ElMessage.info('JWT信息已在页面中展示')
}

const syncJWT = async () => {
  if (!account.value) return

  try {
    // Get all available clusters
    const availableClusters = clusterStore.clusters

    if (availableClusters.length === 0) {
      ElMessage.warning('没有可用的集群进行同步')
      return
    }

    // Show cluster selection dialog
    const selectedClusterIds = await showClusterSelectionDialog(availableClusters)

    if (!selectedClusterIds || selectedClusterIds.length === 0) {
      return // User cancelled or didn't select any clusters
    }

    // Show confirmation dialog
    const clusterNames = selectedClusterIds.map((id) => getClusterName(id) || '未知集群').join(', ')
    await ElMessageBox.confirm(
      `将向以下集群同步JWT: ${clusterNames}。确定要继续吗？`,
      '确认JWT同步',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    // Perform sync
    const response = await accountApi.syncAccountJWT(account.value.id, {
      cluster_ids: selectedClusterIds,
    })

    ElMessage.success(`JWT已成功同步到 ${response.cluster_count} 个集群`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('JWT同步失败:', error)
      ElMessage.error('JWT同步失败')
    }
  }
}

const showClusterSelectionDialog = (clusters: any[]): Promise<string[] | null> => {
  return new Promise((resolve) => {
    const selectedIds = ref<string[]>([])

    ElMessageBox({
      title: '选择要同步的集群',
      message: h('div', [
        h(
          'p',
          { style: 'margin-bottom: 16px; color: var(--el-text-color-regular)' },
          '请选择要同步JWT的集群（可多选）：'
        ),
        h(
          'div',
          { style: 'max-height: 300px; overflow-y: auto;' },
          clusters.map((cluster) =>
            h(
              'label',
              {
                key: cluster.id,
                style:
                  'display: flex; align-items: center; margin-bottom: 12px; cursor: pointer; padding: 8px; border-radius: 4px; transition: background-color 0.2s;',
                onMouseenter: (e: Event) => {
                  ;(e.target as HTMLElement).style.backgroundColor = 'var(--el-fill-color-light)'
                },
                onMouseleave: (e: Event) => {
                  ;(e.target as HTMLElement).style.backgroundColor = 'transparent'
                },
              },
              [
                h('input', {
                  type: 'checkbox',
                  value: cluster.id,
                  style: 'margin-right: 8px;',
                  onChange: (e: Event) => {
                    const target = e.target as HTMLInputElement
                    if (target.checked) {
                      selectedIds.value.push(cluster.id)
                    } else {
                      const index = selectedIds.value.indexOf(cluster.id)
                      if (index > -1) {
                        selectedIds.value.splice(index, 1)
                      }
                    }
                  },
                }),
                h('span', { style: 'font-weight: 500;' }, cluster.name),
                h(
                  'span',
                  {
                    style:
                      'margin-left: 8px; font-size: 12px; color: var(--el-text-color-placeholder);',
                  },
                  `(${cluster.id})`
                ),
              ]
            )
          )
        ),
      ]),
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      beforeClose: (action, _instance, done) => {
        if (action === 'confirm') {
          if (selectedIds.value.length === 0) {
            ElMessage.warning('请至少选择一个集群')
            return
          }
          resolve(selectedIds.value)
        } else {
          resolve(null)
        }
        done()
      },
    }).catch(() => {
      resolve(null)
    })
  })
}

const manageAssociation = () => {
  sharingDialogVisible.value = true
}

const handleSharingRefresh = async () => {
  // 刷新账户信息以更新导入导出配置
  await loadAccount()
}

const deleteAccount = async () => {
  if (!account.value) return

  try {
    await ElMessageBox.confirm('这将永久删除账户和所有关联数据。此操作不可撤销。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error',
    })

    deleting.value = true
    await accountStore.deleteAccount(account.value.id)
    ElMessage.success('账户已删除')
    router.push('/accounts')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除账户失败:', error)
      // 显示后端返回的具体错误信息
      const errorMessage =
        error.userMessage ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        '删除账户失败'
      ElMessage.error(errorMessage)
    }
  } finally {
    deleting.value = false
  }
}

const loadJWT = async () => {
  if (!account.value) return

  jwtLoading.value = true
  try {
    const jwtData = await accountApi.getAccountJWT(account.value.id)
    currentJWT.value = jwtData
  } catch (error) {
    console.error('获取账户JWT失败:', error)
    ElMessage.error('获取JWT失败')
    currentJWT.value = null
  } finally {
    jwtLoading.value = false
  }
}

const copyJWT = async () => {
  if (currentJWT.value) {
    const success = await copyToClipboard(currentJWT.value.raw_token)
    if (success) {
      ElMessage.success('JWT已复制到剪贴板')
    } else {
      ElMessage.error('复制JWT失败')
    }
  }
}

const enableAccount = async () => {
  if (!account.value) return

  statusChanging.value = true
  try {
    await accountStore.enableAccount(account.value.id)
    account.value.status = AccountStatus.ACTIVE
    ElMessage.success('账户已启用')
  } catch (error) {
    console.error('启用账户失败:', error)
    ElMessage.error('启用账户失败')
  } finally {
    statusChanging.value = false
  }
}

const disableAccount = async () => {
  if (!account.value) return

  try {
    await ElMessageBox.confirm('这将禁用账户和所有关联用户。确定要继续吗？', '确认禁用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    statusChanging.value = true
    await accountStore.disableAccount(account.value.id)
    account.value.status = AccountStatus.DISABLED
    ElMessage.success('账户已禁用')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('禁用账户失败:', error)
      ElMessage.error('禁用账户失败')
    }
  } finally {
    statusChanging.value = false
  }
}

const loadAccount = async () => {
  if (!route.params.id) return

  loading.value = true
  try {
    account.value = await accountStore.fetchAccount(route.params.id as string)

    // Load JWT information
    await loadJWT()

    // Load user count and JWT task count
    await Promise.all([loadUserCount(), loadJWTTaskCount()])
  } catch (error) {
    console.error('加载账户详情失败:', error)
    ElMessage.error('加载账户详情失败')
  } finally {
    loading.value = false
  }
}

const loadUserCount = async () => {
  if (!account.value) return

  try {
    userCount.value = await accountApi.getAccountUserCount(account.value.id)
  } catch (error) {
    console.error('获取关联用户数失败:', error)
    userCount.value = 0
  }
}

const loadJWTTaskCount = async () => {
  if (!account.value) return

  try {
    jwtTaskCount.value = await accountApi.getJWTTaskCountByPublicKey(account.value.public_key)
  } catch (error) {
    console.error('获取JWT任务数失败:', error)
    jwtTaskCount.value = 0
  }
}

onMounted(async () => {
  // Load clusters if not already loaded (for JWT sync dialog)
  if (clusterStore.clusters.length === 0) {
    await clusterStore.fetchClusters()
  }

  // Load account details
  loadAccount()
})
</script>

<style scoped lang="scss">
.account-detail {
  padding: 20px;
  max-width: 100%;
  margin: 0;
}

.page-header {
  margin-bottom: 24px;

  .back-button {
    margin-bottom: 16px;
    color: var(--el-color-primary);
  }

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  p {
    color: var(--el-text-color-regular);
    font-size: 16px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.name-field {
  strong {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.id-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  code {
    background: var(--el-bg-color-page);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-family: monospace;
    line-height: 1.4;
    word-break: break-all;
  }
}

.description-field {
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.cluster-field {
  .no-cluster {
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
}

.datetime-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.key-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  .key-text {
    background: var(--el-bg-color-page);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: monospace;
    line-height: 1.4;
    word-break: break-all;
    max-width: 100%;
    flex: 1;
  }
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-button {
    width: 100%;
    justify-content: flex-start;

    &.danger-button {
      margin-top: 8px;
    }
  }
}

.stats-section {
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .stat-label {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .stat-value {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }
}

.account-not-found {
  padding: 60px 0;
  text-align: center;
}

.jwt-sections {
  .jwt-section {
    .section-header {
      margin-bottom: 12px;

      h4 {
        color: var(--el-text-color-primary);
        font-size: 14px;
        font-weight: 500;
        margin: 0;
      }
    }

    .jwt-token,
    .jwt-claims {
      background: var(--el-bg-color-page);
      border-radius: 8px;
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;

      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
        word-wrap: break-word;
        white-space: pre-wrap;
      }
    }
  }
}

.limits-claims {
  background: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    word-wrap: break-word;
    white-space: pre-wrap;
  }
}

// JSON syntax highlighting styles
:deep(.json-syntax) {
  .json-key {
    color: #0969da !important; // Blue for keys
    font-weight: 500;
  }

  .json-string {
    color: #0a3069 !important; // Dark blue for strings
  }

  .json-number {
    color: #1f883d !important; // Green for numbers
  }

  .json-boolean {
    color: #8250df !important; // Purple for booleans
  }

  .json-null {
    color: #656d76 !important; // Gray for null
    font-style: italic;
  }

  .json-bracket {
    color: #cf222e !important; // Red for structural elements
    font-weight: bold;
  }
}

.no-jwt {
  text-align: center;
  padding: 40px 0;
}

:deep(.el-card) {
  .el-card__header {
    padding: 20px;
  }

  .el-card__body {
    padding: 20px;
  }
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
    width: 140px;
  }

  .el-descriptions__content {
    color: var(--el-text-color-regular);
  }

  .el-descriptions-item__cell {
    padding: 12px 16px;
  }
}
</style>

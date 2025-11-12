<template>
  <div class="account-list">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>账户管理</h1>
          <p>管理NATS账户和配置信息</p>
        </div>
        <el-button type="primary" @click="$router.push('/accounts/create')">
          <el-icon><Plus /></el-icon>
          创建账户
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="5">
          <el-input v-model="searchQuery" placeholder="搜索账户..." clearable @input="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="3">
          <el-select v-model="statusFilter" placeholder="状态" clearable @change="handleFilter">
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model="accountTypeFilter"
            placeholder="账户类型"
            clearable
            @change="handleFilter"
          >
            <el-option label="系统账户" value="system" />
            <el-option label="普通账户" value="normal" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model="clusterFilter"
            placeholder="所属集群"
            clearable
            filterable
            @change="handleFilter"
          >
            <el-option
              v-for="cluster in clusterStore.clusters"
              :key="cluster.id"
              :label="cluster.name"
              :value="cluster.id"
            />
          </el-select>
        </el-col>

        <el-col :span="3">
          <el-select v-model="sortBy" placeholder="排序字段" @change="handleFilter">
            <el-option label="名称" value="name" />
            <el-option label="创建日期" value="created_at" />
            <el-option label="更新日期" value="updated_at" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="sortOrder" placeholder="排序方式" @change="handleFilter">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="refreshData" :loading="accountStore.loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table
        :data="accountStore.accounts"
        v-loading="accountStore.loading"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="名称" sortable min-width="180">
          <template #default="{ row }">
            <div class="account-info">
              <div class="account-name clickable" @click="viewAccountDetail(row)">
                {{ row.name }}
              </div>
              <div class="account-id">{{ row.id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.description" placement="top">
              <div class="description-text">{{ row.description }}</div>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="public_key" label="公钥" min-width="200">
          <template #default="{ row }">
            <div class="key-field">
              <code class="key-text">{{ formatKey(row.public_key) }}</code>
              <el-button text size="small" @click="handleCopyToClipboard(row.public_key)">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="is_system_account" label="账户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_system_account ? 'info' : 'warning'" size="small">
              {{ row.is_system_account ? '系统账户' : '普通账户' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="cluster_name" label="所属集群" width="120">
          <template #default="{ row }">
            <div class="cluster-info">
              <span class="cluster-name">{{ row.cluster_name || '不固定' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" sortable>
          <template #default="{ row }">
            <div class="time-info">
              <div class="time-value">{{ formatDateTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="160" sortable>
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.updated_at && row.updated_at !== row.created_at" class="time-value">
                {{ formatDateTime(row.updated_at) }}
              </div>
              <div v-else class="time-value">-</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button text type="primary" size="small" @click="editAccount(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button text type="primary" size="small" @click="viewUsers(row)">
                <el-icon><Avatar /></el-icon>
                用户
              </el-button>
              <el-button text type="danger" size="small" @click="deleteAccount(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="accountStore.currentPage"
          v-model:page-size="accountStore.pageSize"
          :total="accountStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- JWT View Dialog -->
    <el-dialog
      v-model="jwtDialogVisible"
      title="账户JWT信息"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-loading="jwtLoading" class="jwt-content">
        <div v-if="currentJWT" class="jwt-sections">
          <!-- Raw JWT Token -->
          <div class="jwt-section">
            <div class="section-header">
              <h3>JWT令牌</h3>
              <el-button size="small" @click="copyJWT">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
            <div class="jwt-token">
              <pre>{{ currentJWT.raw_token }}</pre>
            </div>
          </div>

          <!-- Decoded Claims -->
          <div class="jwt-section">
            <div class="section-header">
              <h3>解码后的声明</h3>
            </div>
            <div class="jwt-claims">
              <pre>{{ JSON.stringify(currentJWT.claims, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="jwtDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- JWT同步对话框 -->
    <el-dialog
      v-model="syncJWTDialogVisible"
      title="同步JWT到集群"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="syncJWTLoading" class="sync-jwt-content">
        <div v-if="currentSyncAccount" class="sync-account-info">
          <h3>账户信息</h3>
          <p><strong>账户名称：</strong>{{ currentSyncAccount.name }}</p>
          <p>
            <strong>账户类型：</strong>
            <el-tag :type="currentSyncAccount.is_system_account ? 'info' : 'warning'" size="small">
              {{ currentSyncAccount.is_system_account ? '系统账户' : '普通账户' }}
            </el-tag>
          </p>
          <p>
            <strong>当前状态：</strong>
            <el-tag
              :type="currentSyncAccount.status === 'active' ? 'success' : 'danger'"
              size="small"
            >
              {{ currentSyncAccount.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </p>
        </div>

        <div class="cluster-selection">
          <h3>选择目标集群</h3>
          <p class="help-text">请选择要同步JWT的集群。JWT将通过异步任务推送到选定的集群。</p>

          <div class="cluster-list">
            <div v-for="cluster in clusterStore.clusters" :key="cluster.id" class="cluster-item">
              <el-checkbox
                v-model="selectedClusterIds"
                :value="cluster.id"
                :disabled="cluster.status !== 'active'"
              >
                <div class="cluster-info">
                  <div class="cluster-name">
                    {{ cluster.name }}
                    <el-tag
                      v-if="cluster.status !== 'active'"
                      type="danger"
                      size="small"
                      style="margin-left: 8px"
                    >
                      禁用
                    </el-tag>
                  </div>
                  <div class="cluster-url">{{ formatClusterAddress(cluster) }}</div>
                </div>
              </el-checkbox>
            </div>
          </div>

          <div v-if="clusterStore.clusters.length === 0" class="no-clusters">
            <p>没有可用的集群。请先创建集群。</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeSyncJWTDialog">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSyncJWT"
          :loading="syncSubmitting"
          :disabled="selectedClusterIds.length === 0"
        >
          开始同步 ({{ selectedClusterIds.length }} 个集群)
        </el-button>
      </template>
    </el-dialog>

    <!-- Simple Account Association Dialog -->
    <el-dialog
      v-model="associationDialogVisible"
      title="账户数据共享配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-loading="associationLoading" class="simple-association-content">
        <div class="association-step">
          <h3>步骤 1: 选择数据接收方</h3>
          <p>选择要接收当前账户数据的目标账户：</p>
          <el-select
            v-model="selectedTargetAccount"
            placeholder="选择接收方账户"
            filterable
            style="width: 100%"
            @change="handleTargetAccountChange"
          >
            <el-option
              v-for="account in otherAccounts"
              :key="account.id"
              :label="`${account.name} (${account.id})`"
              :value="account.id"
            />
          </el-select>
        </div>

        <div v-if="selectedTargetAccount" class="association-step">
          <h3>步骤 2: 配置共享主题</h3>
          <p>添加要共享给接收方的数据主题：</p>

          <div class="subjects-list">
            <div v-for="(subject, index) in associationSubjects" :key="index" class="subject-item">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-input
                    v-model="subject.base_subject"
                    placeholder="如: orders, events, notifications"
                  />
                </el-col>
                <el-col :span="6">
                  <el-select v-model="subject.pattern" placeholder="模式选择">
                    <el-option label="所有子主题 (.>)" value=".>" />
                    <el-option label="直接子主题 (.*)" value=".*" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-select v-model="subject.type" placeholder="通信类型">
                    <el-option label="流数据" value="stream" />
                    <el-option label="服务调用" value="service" />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-button
                    type="danger"
                    text
                    @click="removeSubject(index)"
                    :disabled="associationSubjects.length <= 1"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
              <el-row v-if="subject.base_subject && subject.pattern">
                <el-col :span="24">
                  <div class="subject-preview">
                    主题预览: <code>{{ subject.base_subject + subject.pattern }}</code>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>

          <el-button type="primary" text @click="addSubject" style="margin-top: 10px">
            <el-icon><Plus /></el-icon>
            添加主题
          </el-button>
        </div>

        <div v-if="selectedTargetAccount" class="association-step">
          <h3>步骤 3: 确认配置</h3>
          <div class="config-summary">
            <p>
              <strong>数据流向:</strong> {{ currentAssociationAccount?.name }} →
              {{ getSelectedTargetAccountName() }}
            </p>
            <p>
              <strong>{{ currentAssociationAccount?.name }}</strong> 将向
              <strong>{{ getSelectedTargetAccountName() }}</strong> 共享数据
            </p>
            <p>
              <strong>{{ getSelectedTargetAccountName() }}</strong> 将能够订阅和接收这些主题的数据
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeAssociationDialog">取消</el-button>
        <el-button
          type="primary"
          @click="createAssociation"
          :loading="submitting"
          :disabled="!canCreateAssociation"
        >
          创建关联
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts'
import { useClusterStore } from '@/stores/clusters'
import { accountApi } from '@/api/accounts'
import { ElMessage, ElDialog, ElMessageBox } from 'element-plus'
import { formatDateTime, formatKey, copyToClipboard } from '@/utils'
import {
  Plus,
  Search,
  RefreshLeft,
  Refresh,
  DocumentCopy,
  Avatar,
  Delete,
  Key,
  Connection,
  Edit,
} from '@element-plus/icons-vue'
import type { Account } from '@/types'

const router = useRouter()
const accountStore = useAccountStore()
const clusterStore = useClusterStore()

const searchQuery = ref('')
const statusFilter = ref('')
const accountTypeFilter = ref('') // 账户类型过滤器
const clusterFilter = ref('') // 集群过滤器

const sortBy = ref('created_at')
const sortOrder = ref('desc')

// JWT dialog state
const jwtDialogVisible = ref(false)
const jwtLoading = ref(false)
const currentJWT = ref<{ raw_token: string; claims: any } | null>(null)

// JWT同步对话框状态
const syncJWTDialogVisible = ref(false)
const syncJWTLoading = ref(false)
const currentSyncAccount = ref<Account | null>(null)
const selectedClusterIds = ref<string[]>([])
const syncSubmitting = ref(false)

// Simple cross-account association dialog state
const associationDialogVisible = ref(false)
const associationLoading = ref(false)
const currentAssociationAccount = ref<Account | null>(null)
const selectedTargetAccount = ref('')
const submitting = ref(false)

// Association subjects
const associationSubjects = ref([
  {
    base_subject: '',
    pattern: '.>',
    type: 'stream' as 'stream' | 'service',
    description: '',
  },
])

// Computed properties
const otherAccounts = computed(() => {
  return accountStore.accounts.filter((acc) => acc.id !== currentAssociationAccount.value?.id)
})

const canCreateAssociation = computed(() => {
  return (
    selectedTargetAccount.value &&
    associationSubjects.value.some((s) => s.base_subject && s.pattern && s.type)
  )
})

// Helper function to get account name by ID
const getAccountName = (accountId: string) => {
  const account = accountStore.accounts.find((acc) => acc.id === accountId)
  return account ? account.name : 'Unknown Account'
}

const getSelectedTargetAccountName = () => {
  return getAccountName(selectedTargetAccount.value)
}

const handleCopyToClipboard = async (text: string) => {
  const success = await copyToClipboard(text)
  if (success) {
    ElMessage.success('已复制到剪贴板')
  } else {
    ElMessage.error('复制失败')
  }
}

const formatClusterAddress = (cluster: any) => {
  if (!cluster || !cluster.host) return '未配置'

  const port = cluster.nats_port || 4222
  return `${cluster.host}:${port}`
}

const handleSearch = () => {
  handleFilter()
}

const handleFilter = () => {
  // 构建筛选参数
  const params: any = {}

  if (searchQuery.value) {
    params.search = searchQuery.value
  }

  if (statusFilter.value) {
    params.status = statusFilter.value
  }

  if (accountTypeFilter.value) {
    params.account_type = accountTypeFilter.value
  }

  if (clusterFilter.value) {
    params.cluster_id = clusterFilter.value
  }

  if (sortBy.value) {
    params.sort_by = sortBy.value
  }

  if (sortOrder.value) {
    params.order = sortOrder.value
  }

  accountStore.fetchAccounts(params)
}

const handleSortChange = ({ prop, order }: any) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  handleFilter()
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  accountTypeFilter.value = ''
  clusterFilter.value = ''
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  handleFilter()
}

const refreshData = () => {
  handleFilter()
}

const handlePageChange = (page: number) => {
  accountStore.currentPage = page
  handleFilter()
}

const handleSizeChange = (size: number) => {
  accountStore.pageSize = size
  handleFilter()
}

const viewAccountDetail = (account: Account) => {
  router.push(`/accounts/${account.id}`)
}

const editAccount = (account: Account) => {
  router.push(`/accounts/${account.id}/edit`)
}

const viewUsers = (account: Account) => {
  router.push(`/accounts/${account.id}/users`)
}

const viewJWT = async (account: Account) => {
  jwtLoading.value = true
  jwtDialogVisible.value = true
  currentJWT.value = null

  try {
    const jwtData = await accountApi.getAccountJWT(account.id)
    currentJWT.value = jwtData
  } catch (error) {
    console.error('获取账户JWT失败:', error)
    ElMessage.error('获取JWT失败')
    jwtDialogVisible.value = false
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

// JWT同步相关方法
const showSyncJWTDialog = async (account: Account) => {
  currentSyncAccount.value = account
  selectedClusterIds.value = []
  syncJWTDialogVisible.value = true

  // 加载集群列表
  if (clusterStore.clusters.length === 0) {
    await clusterStore.fetchClusters()
  }
}

const closeSyncJWTDialog = () => {
  syncJWTDialogVisible.value = false
  currentSyncAccount.value = null
  selectedClusterIds.value = []
}

const confirmSyncJWT = async () => {
  if (!currentSyncAccount.value || selectedClusterIds.value.length === 0) {
    ElMessage.error('请选择至少一个集群')
    return
  }

  syncSubmitting.value = true
  try {
    const result = await accountApi.syncAccountJWT(currentSyncAccount.value.id, {
      cluster_ids: selectedClusterIds.value,
    })

    ElMessage.success(`JWT同步任务已创建，将同步到 ${result.cluster_count} 个集群`)
    closeSyncJWTDialog()
  } catch (error: any) {
    console.error('JWT同步失败:', error)
    ElMessage.error(error.response?.data?.error || 'JWT同步失败')
  } finally {
    syncSubmitting.value = false
  }
}

// Simple cross-account association functions
const manageAssociation = async (account: Account) => {
  currentAssociationAccount.value = account
  selectedTargetAccount.value = ''
  associationSubjects.value = [
    {
      base_subject: '',
      pattern: '.>',
      type: 'stream',
      description: '',
    },
  ]
  associationDialogVisible.value = true
}

const handleTargetAccountChange = () => {
  // Reset subjects when target account changes
  associationSubjects.value = [
    {
      base_subject: '',
      pattern: '.>',
      type: 'stream',
      description: '',
    },
  ]
}

const addSubject = () => {
  associationSubjects.value.push({
    base_subject: '',
    pattern: '.>',
    type: 'stream',
    description: '',
  })
}

const removeSubject = (index: number) => {
  if (associationSubjects.value.length > 1) {
    associationSubjects.value.splice(index, 1)
  }
}

const closeAssociationDialog = () => {
  associationDialogVisible.value = false
  currentAssociationAccount.value = null
  selectedTargetAccount.value = ''
  associationSubjects.value = [
    {
      base_subject: '',
      pattern: '.>',
      type: 'stream',
      description: '',
    },
  ]
}

const createAssociation = async () => {
  if (!currentAssociationAccount.value || !selectedTargetAccount.value) return

  // Filter out empty subjects
  const validSubjects = associationSubjects.value.filter(
    (s) => s.base_subject && s.pattern && s.type
  )

  if (validSubjects.length === 0) {
    ElMessage.error('请至少添加一个有效的主题')
    return
  }

  submitting.value = true
  try {
    await accountApi.createAccountAssociation(currentAssociationAccount.value.id, {
      target_account_id: selectedTargetAccount.value,
      subjects: validSubjects,
      description: `${currentAssociationAccount.value.name} exports subjects to ${getSelectedTargetAccountName()}`,
    })

    ElMessage.success('账户数据共享配置创建成功！')
    closeAssociationDialog()
    // Refresh account list to show updated exports/imports
    await accountStore.fetchAccounts()
  } catch (error) {
    console.error('创建关联失败:', error)
    ElMessage.error('创建账户数据共享配置失败')
  } finally {
    submitting.value = false
  }
}

// 删除账户
const deleteAccount = async (account: Account) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户 "${account.name}" 吗？这将永久删除账户和所有关联数据。此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    )

    await accountStore.deleteAccount(account.id)
    ElMessage.success('账户已删除')
    // 刷新列表
    await accountStore.fetchAccounts()
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
  }
}

onMounted(async () => {
  // 加载集群列表用于筛选
  if (clusterStore.clusters.length === 0) {
    await clusterStore.fetchClusters()
  }
  // 加载账户列表
  accountStore.fetchAccounts()
})
</script>

<style scoped lang="scss">
.account-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

    p {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}

.filter-card {
  margin-bottom: 20px;
}

.account-info {
  .account-name {
    font-weight: 500;
    color: var(--el-text-color-primary);

    &.clickable {
      cursor: pointer;
      color: var(--el-color-primary);
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }
  }

  .account-id {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.description-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-field {
  display: flex;
  align-items: center;
  gap: 8px;

  .key-text {
    background: var(--el-bg-color-page);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.cluster-info {
  .cluster-name {
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
}

/* JWT Dialog Styles */
.jwt-content {
  min-height: 200px;
}

.jwt-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.jwt-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .jwt-token,
  .jwt-claims {
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

/* JWT同步对话框样式 */
.sync-jwt-content {
  .sync-account-info {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--el-bg-color-page);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);

    h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 8px 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .cluster-selection {
    h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .help-text {
      margin: 0 0 16px 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
      line-height: 1.5;
    }

    .cluster-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      padding: 12px;

      .cluster-item {
        margin-bottom: 12px;
        padding: 12px;
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        background: var(--el-bg-color);
        transition: all 0.2s;

        &:hover {
          background: var(--el-bg-color-page);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .cluster-info {
          margin-left: 8px;

          .cluster-name {
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
          }

          .cluster-url {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            font-family: monospace;
          }
        }
      }
    }

    .no-clusters {
      text-align: center;
      padding: 40px 20px;
      color: var(--el-text-color-placeholder);

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  }
}

/* Cross-account association dialog styles */
.association-content {
  min-height: 400px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

/* Simple association dialog styles */
.simple-association-content {
  .association-step {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color-page);

    h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0 0 15px 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .subjects-list {
    .subject-item {
      margin-bottom: 15px;
      padding: 15px;
      border: 1px solid var(--el-border-color);
      border-radius: 6px;
      background: var(--el-bg-color);

      .subject-preview {
        margin-top: 10px;
        padding: 8px 12px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
        font-size: 12px;
        color: var(--el-text-color-regular);

        code {
          color: var(--el-color-primary);
          font-weight: 500;
        }
      }
    }
  }

  .help-text {
    margin-top: 10px;
    padding: 10px;
    background: var(--el-color-info-light-9);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}
</style>

<template>
  <div class="jetstream-list">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>JetStream 管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          创建 JetStream
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filters">
        <div class="filter-row">
          <el-input
            v-model="searchQuery"
            placeholder="搜索名称或描述..."
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            style="width: 120px"
            clearable
            @change="handleFilter"
          >
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="错误" value="error" />
          </el-select>

          <el-select
            v-model="syncStatusFilter"
            placeholder="同步状态"
            style="width: 120px"
            clearable
            @change="handleFilter"
          >
            <el-option label="待同步" value="pending" />
            <el-option label="同步中" value="syncing" />
            <el-option label="已同步" value="synced" />
            <el-option label="同步失败" value="failed" />
          </el-select>

          <el-select
            v-model="clusterFilter"
            placeholder="集群筛选"
            style="width: 200px"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="cluster in clusterOptions"
              :key="cluster.id"
              :label="cluster.name"
              :value="cluster.id"
            />
          </el-select>

          <el-button @click="handleResetFilters">重置筛选</el-button>
          <el-button type="primary" @click="handleQuery" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="jetstreams" empty-text="暂无 JetStream 数据" stripe>
        <el-table-column prop="name" label="名称" width="200" sortable>
          <template #default="{ row }">
            <div class="name-cell">
              <div class="name-link" @click="handleViewDetail(row.id)">
                {{ row.name }}
              </div>
              <div class="jetstream-id">{{ row.id }}</div>
              <span v-if="row.nats_operate_user?.name" class="operate-user">
                {{ row.nats_operate_user.name }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" width="220">
          <template #default="{ row }">
            <div class="description-cell">
              <el-tooltip
                :content="row.description"
                placement="top"
                :disabled="!row.description || row.description.length <= 30"
              >
                <span class="description-text">{{ formatDescription(row.description) }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="集群" width="180">
          <template #default="{ row }">
            <div class="cluster-cell">
              <span v-if="getClusterName(row.cluster_id)" class="cluster-name">{{
                getClusterName(row.cluster_id)
              }}</span>
              <span v-else class="text-muted cluster-id"
                >{{ row.cluster_id.substring(0, 8) }}...</span
              >
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="同步状态" width="120">
          <template #default="{ row }">
            <div class="sync-status-cell">
              <el-tag :type="getSyncStatusTagType(row.sync_status)" size="small">
                {{ getSyncStatusText(row.sync_status) }}
              </el-tag>
              <el-tooltip
                v-if="row.sync_status === 'failed' && row.sync_message"
                :content="row.sync_message"
                placement="top"
              >
                <el-icon class="error-icon"><WarningFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Subjects" width="200">
          <template #default="{ row }">
            <div class="subjects-cell">
              <template v-if="row.subjects && row.subjects.length > 0">
                <el-tag
                  v-for="(subject, index) in row.subjects.slice(0, 2)"
                  :key="subject"
                  size="small"
                  :type="index === 0 ? 'primary' : 'success'"
                >
                  {{ subject }}
                </el-tag>
                <el-tooltip
                  v-if="row.subjects.length > 2"
                  :content="row.subjects.slice(2).join(', ')"
                  placement="top"
                >
                  <el-tag size="small" type="info"> +{{ row.subjects.length - 2 }} </el-tag>
                </el-tooltip>
              </template>
              <template v-else>
                <span class="text-muted">无</span>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="配置" width="140">
          <template #default="{ row }">
            <div class="config-cell">
              <div class="config-item">
                <el-tag size="small" effect="plain">{{ getStorageText(row.storage) }}</el-tag>
              </div>
              <div class="config-item">
                <el-tag size="small" effect="plain">{{ getRetentionText(row.retention) }}</el-tag>
              </div>
              <div class="config-item">
                <span class="text-small">副本: {{ row.replicas }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.updated_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row.id)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                v-if="row.sync_status === 'failed'"
                type="warning"
                size="small"
                @click="handleRetry(row.id)"
                :loading="retryingIds.includes(row.id)"
              >
                <el-icon><RefreshRight /></el-icon>
                重试
              </el-button>
              <el-tooltip content="对比NATS" placement="top">
                <el-button
                  type="info"
                  size="small"
                  @click="handleViewDiff(row.id, row.name)"
                  class="icon-only"
                >
                  <el-icon><el-icon-files /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row.id)"
                  class="icon-only"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Diff Dialog -->
    <DiffDialog
      v-model:visible="diffDialogVisible"
      :jet-stream-id="selectedJetStreamId"
      :jet-stream-name="selectedJetStreamName"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  RefreshRight,
  Edit,
  Delete,
  Document,
  WarningFilled,
} from '@element-plus/icons-vue'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useClusterStore } from '@/stores/clusters'
import DiffDialog from '@/components/DiffDialog.vue'
import type { JetStreamStatus, JetStreamStorageType, JetStreamRetentionPolicy } from '@/types'
import { formatDateTime } from '@/utils'

const router = useRouter()
const jetStreamStore = useJetStreamStore()
const clustersStore = useClusterStore()

// State
const retryingIds = ref<string[]>([])
const diffDialogVisible = ref(false)
const selectedJetStreamId = ref('')
const selectedJetStreamName = ref('')

// Computed
const jetstreams = computed(() => jetStreamStore.jetstreams)
const loading = computed(() => jetStreamStore.loading)
const total = computed(() => jetStreamStore.total)
const currentPage = computed({
  get: () => jetStreamStore.currentPage,
  set: (value) => (jetStreamStore.currentPage = value),
})
const pageSize = computed({
  get: () => jetStreamStore.pageSize,
  set: (value) => (jetStreamStore.pageSize = value),
})

const searchQuery = computed({
  get: () => jetStreamStore.searchQuery,
  set: (value) => (jetStreamStore.searchQuery = value),
})
const statusFilter = computed({
  get: () => jetStreamStore.statusFilter,
  set: (value) => (jetStreamStore.statusFilter = value),
})
const clusterFilter = computed({
  get: () => jetStreamStore.clusterFilter,
  set: (value) => (jetStreamStore.clusterFilter = value),
})

const syncStatusFilter = computed({
  get: () => jetStreamStore.syncStatusFilter,
  set: (value) => (jetStreamStore.syncStatusFilter = value),
})

const clusterOptions = computed(() => clustersStore.clusters)

// Methods
const fetchData = async () => {
  try {
    await Promise.all([
      jetStreamStore.fetchJetStreams({
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
        cluster_id: clusterFilter.value || undefined,
        sync_status: syncStatusFilter.value || undefined,
        page: currentPage.value,
        page_size: pageSize.value,
      }),
      clustersStore.fetchClusters(),
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleFilter = () => {
  currentPage.value = 1
  fetchData()
}

const handleResetFilters = () => {
  jetStreamStore.resetFilters()
  currentPage.value = 1
  fetchData()
}

const handleQuery = () => {
  currentPage.value = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/jetstreams/create')
}

const handleEdit = (id: string) => {
  router.push(`/jetstreams/${id}/edit`)
}

const handleViewDetail = (id: string) => {
  router.push(`/jetstreams/${id}`)
}

const handleViewDiff = (id: string, name: string) => {
  selectedJetStreamId.value = id
  selectedJetStreamName.value = name
  diffDialogVisible.value = true
}

const handleSync = async (id: string) => {
  try {
    await jetStreamStore.retryJetStreamCreation(id)
    ElMessage.success('JetStream 同步到集群成功')
  } catch (error) {
    ElMessage.error('同步失败')
  }
}

const handleRefreshStatus = async (id: string) => {
  try {
    const updatedJetStream = await jetStreamStore.syncJetStreamStatus(id)

    // Provide feedback based on sync status
    if (updatedJetStream.sync_status === 'syncing' || updatedJetStream.sync_status === 'pending') {
      ElMessage.success('同步操作已启动，正在与NATS服务器同步中...')
    } else {
      ElMessage.success('状态刷新成功')
    }

    // 刷新列表数据以获取最新同步状态
    await fetchData()
  } catch (error: any) {
    console.error('刷新状态失败:', error)

    let errorMessage = '刷新状态失败'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      type: 'error',
      message: errorMessage,
      duration: 10000,
      showClose: true,
    })
  }
}

const handleRetry = async (id: string) => {
  try {
    retryingIds.value.push(id)
    await jetStreamStore.retryJetStreamCreation(id)
    ElMessage.success('JetStream 重试创建成功')
    // 刷新数据以获取最新状态
    await fetchData()
  } catch (error: any) {
    console.error('JetStream重试失败:', error)

    // 提取错误信息
    let errorMessage = '重试创建失败'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      type: 'error',
      message: errorMessage,
      duration: 10000,
      showClose: true,
    })
  } finally {
    retryingIds.value = retryingIds.value.filter((retryId) => retryId !== id)
  }
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个 JetStream 吗？此操作不可撤销。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await jetStreamStore.deleteJetStream(id)
    ElMessage.success('JetStream 删除成功')
    // 刷新数据
    await fetchData()
  } catch (error: any) {
    if (error === 'cancel') {
      return
    }

    console.error('JetStream删除失败:', error)

    // 提取错误信息
    let errorMessage = '删除失败'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      type: 'error',
      message: errorMessage,
      duration: 10000,
      showClose: true,
    })
  }
}

// Format description for display
const formatDescription = (description: string) => {
  if (!description) return '暂无描述'
  if (description.length <= 30) return description
  return `${description.substring(0, 30)}...`
}

// Utility functions
const getStatusTagType = (status: JetStreamStatus) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'error':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: JetStreamStatus) => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '非活跃'
    case 'error':
      return '错误'
    default:
      return status
  }
}

const getStorageText = (storage: JetStreamStorageType) => {
  switch (storage) {
    case 'file':
      return '文件'
    case 'memory':
      return '内存'
    default:
      return storage
  }
}

const getRetentionText = (retention: JetStreamRetentionPolicy) => {
  switch (retention) {
    case 'limits':
      return '限制'
    case 'interest':
      return '兴趣'
    case 'workqueue':
      return '队列'
    default:
      return retention
  }
}

const getClusterName = (clusterId: string) => {
  const cluster = clusterOptions.value.find((c) => c.id === clusterId)
  return cluster?.name || null
}

const getSyncStatusTagType = (syncStatus: string) => {
  switch (syncStatus) {
    case 'synced':
      return 'success'
    case 'syncing':
      return 'warning'
    case 'pending':
      return 'info'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

const getSyncStatusText = (syncStatus: string) => {
  switch (syncStatus) {
    case 'synced':
      return '已同步'
    case 'syncing':
      return '同步中'
    case 'pending':
      return '待同步'
    case 'failed':
      return '同步失败'
    default:
      return syncStatus
  }
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.jetstream-list {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-right {
    .el-button {
      font-size: 14px;
      padding: 8px 16px;
      height: auto;
    }
  }
}

.filter-card {
  margin-bottom: 20px;

  .el-card__body {
    padding: 16px 20px;
  }
}

.filters {
  padding: 0;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;

  .el-input {
    min-width: 280px;
  }

  .el-select {
    min-width: 120px;
  }

  .el-button {
    height: 32px;
    padding: 8px 16px;
    font-size: 13px;
  }
}

.table-card {
  margin-bottom: 20px;

  .el-table {
    font-size: 13px;

    .el-table__header {
      th {
        background-color: var(--el-bg-color-page);
        font-weight: 600;
        color: var(--el-text-color-primary);
        font-size: 13px;
      }
    }

    .el-table__body {
      tr {
        &:hover {
          background-color: var(--el-fill-color-light);
        }
      }

      td {
        padding: 12px 0;
        vertical-align: middle;
      }
    }
  }
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cluster-cell {
  .cluster-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .cluster-id {
    font-family: monospace;
    font-size: 11px;
  }
}

.subjects-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;

  .el-tag {
    font-size: 11px;
    height: 20px;
    line-height: 18px;
    font-family:
      'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

    &.el-tag--primary {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary-light-7);
    }

    &.el-tag--success {
      background-color: var(--el-color-success-light-9);
      color: var(--el-color-success);
      border: 1px solid var(--el-color-success-light-7);
    }
  }
}

.config-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.config-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: nowrap;

  .el-button {
    min-width: auto;

    &.el-button--small {
      height: 28px;
      padding: 6px 12px;
      font-size: 12px;

      .el-icon {
        font-size: 14px;
      }
    }

    /* 只有图标的按钮样式 */
    &.icon-only {
      width: 32px;
      height: 28px;
      padding: 6px;

      .el-icon {
        margin-right: 0;
        font-size: 16px;
      }
    }
  }
}

.description-cell {
  .description-text {
    display: block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.4;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.text-small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.danger-item {
  color: var(--el-color-danger) !important;

  .el-icon {
    color: var(--el-color-danger) !important;
  }
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .name-link {
    color: var(--el-color-primary);
    cursor: pointer;
    font-weight: 500;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      color: var(--el-color-primary-light-3);
      text-decoration: underline;
    }
  }

  .jetstream-id {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-family: monospace;
  }

  .operate-user {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }
}

.sync-status-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .error-icon {
    color: var(--el-color-danger);
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: var(--el-color-danger-light-3);
    }
  }
}

.subjects-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .el-tag {
    font-size: 11px;
    height: 20px;
    line-height: 18px;
  }
}

.config-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .config-item {
    display: flex;
    gap: 4px;
    align-items: center;

    .el-tag {
      font-size: 10px;
      height: 18px;
      line-height: 16px;
    }
  }
}
</style>

<template>
  <div class="consumer-list">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>Consumer 管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          创建 Consumer
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filters">
        <div class="filter-row">
          <!-- 集群筛选 - 最重要，放在第一位 -->
          <el-select
            v-model="clusterFilter"
            placeholder="集群筛选"
            style="width: 200px"
            clearable
            filterable
            @change="handleClusterChange"
          >
            <el-option
              v-for="cluster in clusterOptions"
              :key="cluster.id"
              :label="cluster.name"
              :value="cluster.id"
            />
          </el-select>

          <!-- JetStream 筛选 - 联动集群 -->
          <el-select
            v-model="jetstreamFilter"
            placeholder="Stream 筛选"
            style="width: 250px"
            clearable
            filterable
            @clear="handleJetStreamClear"
          >
            <el-option
              v-for="jetstream in filteredJetStreamOptions"
              :key="jetstream.id"
              :label="getJetStreamOptionLabel(jetstream)"
              :value="jetstream.id"
            />
          </el-select>

          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 120px" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="错误" value="error" />
          </el-select>

          <el-select
            v-model="syncStatusFilter"
            placeholder="同步状态"
            style="width: 120px"
            clearable
          >
            <el-option label="待同步" value="pending" />
            <el-option label="同步中" value="syncing" />
            <el-option label="已同步" value="synced" />
            <el-option label="同步失败" value="failed" />
          </el-select>

          <el-input
            v-model="searchQuery"
            placeholder="搜索名称或描述..."
            style="width: 240px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button type="primary" @click="handleQuery" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleResetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="consumers" empty-text="暂无 Consumer 数据" stripe>
        <el-table-column label="集群" width="160" sortable>
          <template #default="{ row }">
            <div class="cluster-cell">
              <span v-if="getClusterName(row.jetstream_id)" class="cluster-name">{{
                getClusterName(row.jetstream_id)
              }}</span>
              <span v-else class="text-muted cluster-id">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="名称" width="200" sortable>
          <template #default="{ row }">
            <div class="name-cell">
              <div class="name-link" @click="handleViewDetail(row.id)">
                {{ row.name }}
              </div>
              <div class="consumer-id">{{ row.id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Stream 名称" width="200">
          <template #default="{ row }">
            <div class="jetstream-cell">
              <span v-if="getJetStreamName(row.jetstream_id)" class="jetstream-name">{{
                getJetStreamName(row.jetstream_id)
              }}</span>
              <span v-else class="text-muted jetstream-id"
                >{{ row.jetstream_id?.substring(0, 8) || '-'
                }}{{ row.jetstream_id ? '...' : '' }}</span
              >
            </div>
          </template>
        </el-table-column>

        <el-table-column label="模式" width="80">
          <template #default="{ row }">
            <el-tooltip :content="row.consumer_type === 'push' ? 'Push' : 'Pull'" placement="right">
              <img
                :src="row.consumer_type === 'push' ? iconPush : iconPull"
                :alt="row.consumer_type === 'push' ? 'Push' : 'Pull'"
                class="consumer-type-icon"
              />
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="Ack 策略" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ getAckPolicyText(row.ack_policy) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Deliver Policy" width="160">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{
              getDeliverPolicyText(row.deliver_policy)
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="过滤 Subject" width="180">
          <template #default="{ row }">
            <span class="text-small">{{ row.filter_subject || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="最大重试" width="100" sortable>
          <template #default="{ row }">
            <span class="text-small">{{ row.max_deliver || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Ack Wait" width="100">
          <template #default="{ row }">
            <span class="text-small">{{ formatAckWait(row.ack_wait) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
              <el-tag v-if="row.paused" type="warning" size="small" style="margin-left: 4px">
                已暂停
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="同步状态" width="140">
          <template #default="{ row }">
            <div class="sync-status-cell">
              <el-tag :type="getSyncStatusTagType(row.sync_status)" size="small">
                {{ getSyncStatusText(row.sync_status) }}
              </el-tag>
              <el-tooltip
                v-if="row.sync_status === 'failed' && (row.sync_message || row.sync_failure_reason)"
                :content="row.sync_failure_reason || row.sync_message"
                placement="top"
              >
                <el-icon class="error-icon"><WarningFilled /></el-icon>
              </el-tooltip>
              <el-tooltip v-else-if="row.sync_message" :content="row.sync_message" placement="top">
                <el-icon class="info-icon"><InfoFilled /></el-icon>
              </el-tooltip>
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

        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row.id)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                v-if="!row.paused"
                type="warning"
                size="small"
                @click="handlePause(row.id)"
                :loading="pausingIds.includes(row.id)"
              >
                <el-icon><VideoPause /></el-icon>
                暂停
              </el-button>
              <el-button
                v-else
                type="success"
                size="small"
                @click="handleResume(row.id)"
                :loading="resumingIds.includes(row.id)"
              >
                <el-icon><VideoPlay /></el-icon>
                恢复
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
              <el-tooltip v-if="row.sync_status !== 'failed'" content="对比NATS" placement="top">
                <el-button
                  type="info"
                  size="small"
                  @click="handleViewDiff(row.id, row.name)"
                  class="icon-only"
                >
                  <el-icon><Files /></el-icon>
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
    <ConsumerDiffDialog
      v-model:visible="diffDialogVisible"
      :consumer-id="selectedConsumerId"
      :consumer-name="selectedConsumerName"
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
  RefreshRight,
  Edit,
  Delete,
  WarningFilled,
  InfoFilled,
  VideoPause,
  VideoPlay,
  Files,
} from '@element-plus/icons-vue'
import { useConsumerStore } from '@/stores/consumers'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useClusterStore } from '@/stores/clusters'
import ConsumerDiffDialog from '@/components/ConsumerDiffDialog.vue'
import type {
  ConsumerStatus,
  ConsumerSyncStatus,
  ConsumerAckPolicy,
  ConsumerDeliverPolicy,
} from '@/types'
import { formatDateTime, formatNumber } from '@/utils'
import iconPush from '@/assets/icons/icon_push.png'
import iconPull from '@/assets/icons/icon_pull.png'

const router = useRouter()
const consumerStore = useConsumerStore()
const jetStreamStore = useJetStreamStore()
const clusterStore = useClusterStore()

// State
const retryingIds = ref<string[]>([])
const pausingIds = ref<string[]>([])
const resumingIds = ref<string[]>([])
const diffDialogVisible = ref(false)
const selectedConsumerId = ref('')
const selectedConsumerName = ref('')

// Computed
const consumers = computed(() => consumerStore.consumers)
const loading = computed(() => consumerStore.loading)
const total = computed(() => consumerStore.total)
const currentPage = computed({
  get: () => consumerStore.currentPage,
  set: (value) => (consumerStore.currentPage = value),
})
const pageSize = computed({
  get: () => consumerStore.pageSize,
  set: (value) => (consumerStore.pageSize = value),
})

const searchQuery = computed({
  get: () => consumerStore.searchQuery,
  set: (value) => (consumerStore.searchQuery = value),
})
const statusFilter = computed({
  get: () => consumerStore.statusFilter,
  set: (value) => (consumerStore.statusFilter = value),
})
const syncStatusFilter = computed({
  get: () => consumerStore.syncStatusFilter,
  set: (value) => (consumerStore.syncStatusFilter = value),
})
const jetstreamFilter = computed({
  get: () => consumerStore.jetstreamFilter,
  set: (value) => (consumerStore.jetstreamFilter = value),
})
const clusterFilter = computed({
  get: () => consumerStore.clusterFilter,
  set: (value) => (consumerStore.clusterFilter = value),
})

const jetstreamOptions = computed(() => jetStreamStore.jetstreams)
const clusterOptions = computed(() => clusterStore.clusters)

// JetStream 选项联动集群筛选
const filteredJetStreamOptions = computed(() => {
  if (!clusterFilter.value) {
    return jetstreamOptions.value
  }
  return jetstreamOptions.value.filter((js) => js.cluster_id === clusterFilter.value)
})

// Methods
const fetchData = async () => {
  try {
    await Promise.all([
      consumerStore.fetchConsumers({
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
        sync_status: syncStatusFilter.value || undefined,
        jetstream_id: jetstreamFilter.value || undefined,
        cluster_id: clusterFilter.value || undefined,
        page: currentPage.value,
        page_size: pageSize.value,
      }),
      // 获取所有 JetStream 数据，不受分页限制
      jetStreamStore.fetchJetStreams({ page: 1, page_size: 1000 }),
      // 获取所有集群数据，不受分页限制
      clusterStore.fetchClusters({ page: 1, page_size: 1000 }),
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

// 集群筛选变化处理
const handleClusterChange = () => {
  // 清空 JetStream 筛选（因为已经不在当前集群下）
  if (jetstreamFilter.value) {
    const selectedJetStream = jetstreamOptions.value.find((js) => js.id === jetstreamFilter.value)
    if (selectedJetStream && selectedJetStream.cluster_id !== clusterFilter.value) {
      jetstreamFilter.value = ''
    }
  }
  // 不自动查询，由用户点击查询按钮
}

// JetStream 清空处理
const handleJetStreamClear = () => {
  // 不需要处理，由用户点击查询按钮
}

const handleResetFilters = () => {
  consumerStore.resetFilters()
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
  router.push('/consumers/create')
}

const handleEdit = (id: string) => {
  router.push(`/consumers/${id}/edit`)
}

const handleViewDetail = (id: string) => {
  router.push(`/consumers/${id}`)
}

const handleViewDiff = (id: string, name: string) => {
  selectedConsumerId.value = id
  selectedConsumerName.value = name
  diffDialogVisible.value = true
}

const handlePause = async (id: string) => {
  try {
    pausingIds.value.push(id)
    await consumerStore.pauseConsumer(id)
    ElMessage.success('Consumer 暂停成功')
    await fetchData()
  } catch (error: any) {
    console.error('Consumer暂停失败:', error)

    let errorMessage = '暂停失败'
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
    pausingIds.value = pausingIds.value.filter((pauseId) => pauseId !== id)
  }
}

const handleResume = async (id: string) => {
  try {
    resumingIds.value.push(id)
    await consumerStore.resumeConsumer(id)
    ElMessage.success('Consumer 恢复成功')
    await fetchData()
  } catch (error: any) {
    console.error('Consumer恢复失败:', error)

    let errorMessage = '恢复失败'
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
    resumingIds.value = resumingIds.value.filter((resumeId) => resumeId !== id)
  }
}

const handleRetry = async (id: string) => {
  try {
    retryingIds.value.push(id)
    await consumerStore.retryConsumerSync(id)
    ElMessage.success('Consumer 重试同步成功')
    await fetchData()
  } catch (error: any) {
    console.error('Consumer重试失败:', error)

    let errorMessage = '重试同步失败'
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
    await ElMessageBox.confirm('确定要删除这个 Consumer 吗？此操作不可撤销。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await consumerStore.deleteConsumer(id)
    ElMessage.success('Consumer 删除成功')
    await fetchData()
  } catch (error: any) {
    if (error === 'cancel') {
      return
    }

    console.error('Consumer删除失败:', error)

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
const getStatusTagType = (status: ConsumerStatus) => {
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

const getStatusText = (status: ConsumerStatus) => {
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

const getSyncStatusTagType = (syncStatus: ConsumerSyncStatus) => {
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

const getSyncStatusText = (syncStatus: ConsumerSyncStatus) => {
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

const getAckPolicyText = (ackPolicy: ConsumerAckPolicy) => {
  switch (ackPolicy) {
    case 'explicit':
      return 'Explicit'
    case 'all':
      return 'All'
    case 'none':
      return 'None'
    default:
      return ackPolicy
  }
}

const getDeliverPolicyText = (deliverPolicy: ConsumerDeliverPolicy) => {
  switch (deliverPolicy) {
    case 'all':
      return 'All'
    case 'last':
      return 'Last'
    case 'new':
      return 'New'
    case 'by_start_sequence':
      return 'By Start Sequence'
    case 'by_start_time':
      return 'By Start Time'
    case 'last_per_subject':
      return 'Last Per Subject'
    default:
      return deliverPolicy
  }
}

const formatAckWait = (seconds: number) => {
  if (!seconds || seconds === 0) return '-'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const getJetStreamName = (jetstreamId: string) => {
  const jetstream = jetstreamOptions.value.find((js) => js.id === jetstreamId)
  return jetstream?.name || null
}

// 获取 JetStream 选项标签（显示集群信息）
const getJetStreamOptionLabel = (jetstream: any) => {
  const cluster = clusterOptions.value.find((c) => c.id === jetstream.cluster_id)
  if (cluster) {
    return `${jetstream.name} (${cluster.name})`
  }
  return jetstream.name
}

const getClusterName = (jetstreamId: string) => {
  // 先通过 jetstream_id 找到对应的 JetStream
  const jetstream = jetstreamOptions.value.find((js) => js.id === jetstreamId)
  if (!jetstream || !jetstream.cluster_id) {
    return null
  }
  // 再通过 cluster_id 找到集群名称
  const cluster = clusterOptions.value.find((c) => c.id === jetstream.cluster_id)
  return cluster?.name || null
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.consumer-list {
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

  .consumer-id {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-family: monospace;
  }
}

.description-cell {
  .description-text {
    display: block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.4;
  }
}

.jetstream-cell {
  .jetstream-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .jetstream-id {
    font-family: monospace;
    font-size: 11px;
  }
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

  .info-icon {
    color: var(--el-color-info);
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: var(--el-color-info-light-3);
    }
  }
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
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

.consumer-type-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}
</style>

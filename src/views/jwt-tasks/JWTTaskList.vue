<template>
  <div class="jwt-task-list">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>JWT任务管理</h1>
          <p>监控和管理JWT同步任务</p>
        </div>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Statistics -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">任务总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value pending">{{ stats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value completed">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value failed">{{ stats.failed }}</div>
            <div class="stat-label">失败</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-select v-model="operationFilter" placeholder="操作" clearable @change="handleFilter">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="启用" value="enable" />
            <el-option label="禁用" value="disable" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="状态" clearable @change="handleFilter">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
            <el-option label="创建日期" value="created_at" />
            <el-option label="更新日期" value="updated_at" />
            <el-option label="处理日期" value="completed_at" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="sortOrder" placeholder="顺序" @change="handleFilter">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table :data="tasks" v-loading="loading" stripe @sort-change="handleSortChange">
        <el-table-column label="任务信息" min-width="200">
          <template #default="{ row }">
            <div class="task-info">
              <div class="task-id">{{ row.id }}</div>
              <div class="task-detail">
                <el-tag :type="getOperationTagType(row.operation)" size="small">
                  {{ row.operation }}
                </el-tag>
                <el-tag :type="getStatusTagType(row.status)" size="small" style="margin-left: 8px">
                  <el-icon v-if="row.status === 'processing'" class="rotating">
                    <Loading />
                  </el-icon>
                  {{ row.status }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="public_key" label="账户公钥" min-width="300">
          <template #default="{ row }">
            <div class="entity-id">
              <code>{{ row.public_key || '(未找到公钥:' + row.entity_id + ')' }}</code>
              <el-button
                text
                size="small"
                @click="handleCopyToClipboard(row.public_key || row.entity_id)"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="同步信息" width="100">
          <template #default="{ row }">
            <div class="sync-info">
              <span v-if="row.sync_results && row.sync_results.summary">
                {{ row.sync_results.summary.success }}/{{ row.sync_results.summary.total }}
              </span>
              <span v-else-if="row.trigger_type === 'manual'">
                {{ getSyncSummary(row) }}
              </span>
              <span v-else class="auto-sync">自动</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="completed_at" label="完成时间" width="180" sortable>
          <template #default="{ row }">
            <span v-if="row.completed_at">{{ formatDateTime(row.completed_at) }}</span>
            <span v-else class="not-processed">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button text type="primary" size="small" @click="viewDetails(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>

              <el-button
                v-if="row.status === 'failed'"
                text
                type="warning"
                size="small"
                @click="retryTask(row)"
                :loading="retryingTasks.includes(row.id)"
              >
                <el-icon><RefreshRight /></el-icon>
                重试
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { jwtTaskApi } from '@/api/jwt-tasks'
import { ElMessage } from 'element-plus'
import { formatDateTime, copyToClipboard } from '@/utils'
import {
  Refresh,
  RefreshLeft,
  RefreshRight,
  DocumentCopy,
  View,
  Loading,
} from '@element-plus/icons-vue'
import type { JWTTask, PaginationParams } from '@/types'

const router = useRouter()

const loading = ref(false)
const tasks = ref<JWTTask[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const retryingTasks = ref<string[]>([])

const stats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
})

// Filters
const operationFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')

const handleCopyToClipboard = async (text: string) => {
  const success = await copyToClipboard(text)
  if (success) {
    ElMessage.success('已复制到剪贴板')
  } else {
    ElMessage.error('复制失败')
  }
}

const getOperationTagType = (operation: string) => {
  switch (operation) {
    case 'create':
      return 'success'
    case 'update':
      return 'warning'
    case 'enable':
      return 'success'
    case 'disable':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'processing':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

const getSyncSummary = (task: JWTTask) => {
  if (task.trigger_type !== 'manual' || !task.cluster_ids) {
    return ''
  }

  // 获取集群ID列表
  const clusterIds = task.cluster_ids.cluster_ids || []
  const totalClusters = Array.isArray(clusterIds) ? clusterIds.length : 0

  if (totalClusters === 0) {
    return ''
  }

  // 如果有同步结果，使用实际结果
  if (task.sync_results && task.sync_results.summary) {
    const summary = task.sync_results.summary
    return `${summary.success}/${summary.total}`
  }

  // 否则根据任务状态简单估算
  let successCount = 0
  if (task.status === 'completed') {
    successCount = totalClusters
  } else if (task.status === 'failed' || task.status === 'processing') {
    successCount = 0
  }

  return `${successCount}/${totalClusters}`
}

const handleFilter = () => {
  fetchTasks()
}

const handleSortChange = ({ prop, order }: any) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  handleFilter()
}

const resetFilters = () => {
  operationFilter.value = ''
  statusFilter.value = ''
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  handleFilter()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTasks()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchTasks()
}

const fetchTasks = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort_by: sortBy.value,
      order: sortOrder.value as 'asc' | 'desc',
    }

    // Add filters
    if (operationFilter.value) {
      ;(params as any).operation = operationFilter.value
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }

    const response = await jwtTaskApi.getTasks(params)
    tasks.value = response
    total.value = response.length
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    tasks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await jwtTaskApi.getTaskStats()
    stats.value = response
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    stats.value = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    }
  }
}

const refreshData = async () => {
  await Promise.all([fetchTasks(), fetchStats()])
}

const viewDetails = (task: JWTTask) => {
  router.push(`/jwt-tasks/${task.id}`)
}

const retryTask = async (task: JWTTask) => {
  retryingTasks.value.push(task.id)
  try {
    await jwtTaskApi.retryTask(task.id)
    ElMessage.success('任务已排队重试')

    // Update task status locally
    const index = tasks.value.findIndex((t) => t.id === task.id)
    if (index !== -1) {
      tasks.value[index].status = 'pending'
      tasks.value[index].retries += 1
    }

    // Refresh stats
    await fetchStats()
  } catch (error) {
    console.error('Failed to retry task:', error)
  } finally {
    retryingTasks.value = retryingTasks.value.filter((id) => id !== task.id)
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped lang="scss">
.jwt-task-list {
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

.stats-row {
  margin-bottom: 20px;

  .stat-card {
    .stat-content {
      text-align: center;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        color: var(--el-text-color-primary);

        &.pending {
          color: var(--el-color-info);
        }

        &.completed {
          color: var(--el-color-success);
        }

        &.failed {
          color: var(--el-color-danger);
        }
      }

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.filter-card {
  margin-bottom: 20px;
}

.task-info {
  .task-id {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
  }

  .task-detail {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
}

.entity-id {
  display: flex;
  align-items: center;
  gap: 8px;

  code {
    background: var(--el-bg-color-page);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.sync-info {
  font-size: 12px;

  .auto-sync {
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
}

.error-message {
  .error-text {
    color: var(--el-color-danger);
    font-size: 12px;
    cursor: pointer;
  }
}

.no-error,
.not-processed {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

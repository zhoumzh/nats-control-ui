<template>
  <div class="cluster-monitoring">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>
            <el-icon class="title-icon"><Monitor /></el-icon>
            集群监控
          </h1>
          <p>监控NATS集群异常状态和连接问题</p>
        </div>
        <div class="header-actions">
          <el-button @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-card>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="监控类型">
            <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 120px">
              <el-option label="健康检查" value="health" />
            </el-select>
          </el-form-item>

          <el-form-item label="连接状态">
            <el-select
              v-model="filters.connection_status"
              placeholder="全部"
              clearable
              style="width: 120px"
            >
              <el-option label="成功" value="success" />
              <el-option label="失败" value="failed" />
              <el-option label="超时" value="timeout" />
            </el-select>
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="fetchHealthRecords">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- Health Records Table -->
    <div class="records-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>集群异常记录</span>
            <div class="header-extra">
              <span class="record-count">共 {{ pagination.total }} 条记录</span>
            </div>
          </div>
        </template>

        <el-table v-loading="recordsLoading" :data="healthRecords" stripe style="width: 100%">
          <el-table-column prop="cluster_name" label="集群名称" width="150">
            <template #default="{ row }">
              <div class="cluster-name-cell">
                <el-icon class="cluster-icon"><Monitor /></el-icon>
                <span>{{ row.cluster_name || 'N/A' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="host_info" label="主机信息" width="180">
            <template #default="{ row }">
              <el-text class="host-text" type="info">{{ row.host_info || 'N/A' }}</el-text>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="健康状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getHealthStatusType(row.status)" size="small" effect="dark">
                {{ getHealthStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="connection_status" label="连接状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getConnectionStatusType(row.connection_status)" size="small">
                {{ getConnectionStatusText(row.connection_status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="response_time" label="响应时间" width="100" align="center">
            <template #default="{ row }">
              <span :class="getResponseTimeClass(row.response_time)">
                {{ row.response_time }}ms
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="test_type" label="测试类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.test_type === 'auto' ? '' : 'warning'" size="small" plain>
                {{ row.test_type === 'auto' ? '自动' : '手动' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="tested_at" label="测试时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.tested_at) }}
            </template>
          </el-table-column>

          <el-table-column prop="error_message" label="错误信息" min-width="200">
            <template #default="{ row }">
              <div v-if="row.error_message" class="error-message">
                <el-tooltip :content="row.error_message" placement="top">
                  <span class="error-text">{{ truncateText(row.error_message, 50) }}</span>
                </el-tooltip>
              </div>
              <span v-else class="success-text">正常</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="triggerManualCheck(row.cluster_id)"
                :loading="checkingClusters.includes(row.cluster_id)"
              >
                重新检查
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Refresh } from '@element-plus/icons-vue'
import { clusterApi } from '@/api/clusters'
import dayjs from 'dayjs'
import type { ClusterHealthResponse } from '@/types'

// Reactive data
const loading = ref(false)
const recordsLoading = ref(false)
const healthRecords = ref<ClusterHealthResponse[]>([])
const checkingClusters = ref<string[]>([])

// Filters and pagination
const filters = ref({
  type: '',
  connection_status: '',
  cluster_id: '',
})

const dateRange = ref<[string, string] | null>(null)

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
})

// Methods
const fetchHealthRecords = async () => {
  recordsLoading.value = true
  try {
    const params: Record<string, any> = {
      ...filters.value,
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
    }

    // Remove empty params
    Object.keys(params).forEach((key) => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })

    const response = await clusterApi.getClusterHealthRecords(params)
    healthRecords.value = response.data
    pagination.value.total = response.total
  } catch (error) {
    console.error('Failed to fetch health records:', error)
    ElMessage.error('获取健康记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await fetchHealthRecords()
  } finally {
    loading.value = false
  }
}

const triggerManualCheck = async (clusterId: string) => {
  checkingClusters.value.push(clusterId)
  try {
    await clusterApi.triggerManualHealthCheck(clusterId)
    ElMessage.success('手动检查已触发')
    // Refresh data after a short delay
    setTimeout(() => {
      refreshData()
    }, 2000)
  } catch (error) {
    console.error('Failed to trigger manual check:', error)
    ElMessage.error('触发手动检查失败')
  } finally {
    checkingClusters.value = checkingClusters.value.filter((id) => id !== clusterId)
  }
}

const resetFilters = () => {
  filters.value = {
    type: '',
    connection_status: '',
    cluster_id: '',
  }
  dateRange.value = null
  pagination.value.page = 1
  fetchHealthRecords()
}

const handleDateRangeChange = () => {
  pagination.value.page = 1
  fetchHealthRecords()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchHealthRecords()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  fetchHealthRecords()
}

// Utility methods
const formatTime = (time: string | undefined) => {
  if (!time) return 'N/A'
  return dayjs(time).format('MM-DD HH:mm:ss')
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getHealthStatusType = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'success'
    case 'unhealthy':
      return 'danger'
    default:
      return 'info'
  }
}

const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '健康'
    case 'unhealthy':
      return '异常'
    default:
      return '未知'
  }
}

const getConnectionStatusType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'timeout':
      return 'warning'
    default:
      return 'info'
  }
}

const getConnectionStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'timeout':
      return '超时'
    default:
      return '未知'
  }
}

const getResponseTimeClass = (time: number) => {
  if (time < 100) return 'response-time-good'
  if (time < 500) return 'response-time-normal'
  return 'response-time-slow'
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped lang="scss">
.cluster-monitoring {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .title-section {
    h1 {
      display: flex;
      align-items: center;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);

      .title-icon {
        margin-right: 8px;
        color: var(--el-color-primary);
      }
    }

    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filters-section {
  margin-bottom: 24px;

  .filter-form {
    margin-bottom: 0;
  }
}

.records-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .record-count {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .cluster-name-cell {
    display: flex;
    align-items: center;

    .cluster-icon {
      color: var(--el-color-primary);
      margin-right: 8px;
    }
  }

  .host-text {
    font-family: monospace;
    font-size: 12px;
  }

  .error-message {
    .error-text {
      color: var(--el-color-danger);
      cursor: help;
    }
  }

  .success-text {
    color: var(--el-color-success);
  }

  .response-time-good {
    color: var(--el-color-success);
    font-weight: 500;
  }

  .response-time-normal {
    color: var(--el-color-warning);
    font-weight: 500;
  }

  .response-time-slow {
    color: var(--el-color-danger);
    font-weight: 500;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>

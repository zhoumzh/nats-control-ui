<template>
  <div class="jwt-task-detail">
    <div class="page-header">
      <el-button text @click="$router.back()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <p>JWT同步任务的详细信息</p>
    </div>

    <div v-loading="loading">
      <div v-if="task">
        <!-- Task Overview -->
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>JWT任务详情</span>
                  <el-tag :type="getStatusTagType(task.status)">
                    <el-icon v-if="task.status === 'processing'" class="rotating">
                      <Loading />
                    </el-icon>
                    {{ task.status }}
                  </el-tag>
                </div>
              </template>

              <el-descriptions :column="1" border size="large">
                <el-descriptions-item label="任务ID">
                  <div class="id-field">
                    <code>{{ task.id }}</code>
                    <el-button text size="small" @click="copyToClipboard(task.id)">
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="账户公钥">
                  <div class="id-field">
                    <code>{{ task.public_key || '(未找到公钥:' + task.entity_id + ')' }}</code>
                    <el-button
                      text
                      size="small"
                      @click="copyToClipboard(task.public_key || task.entity_id)"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="操作">
                  <el-tag :type="getOperationTagType(task.operation)">
                    {{ task.operation }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="创建时间">
                  <div class="datetime-field">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(task.created_at) }}
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="更新时间">
                  <div class="datetime-field">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(task.updated_at) }}
                  </div>
                </el-descriptions-item>

                <el-descriptions-item label="重试次数">
                  <el-tag :type="task.retries > 0 ? 'warning' : 'info'" size="small">
                    {{ task.retries }}/{{ task.max_retries }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="处理时间">
                  <div v-if="task.completed_at" class="datetime-field">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDateTime(task.completed_at) }}
                  </div>
                  <span v-else class="not-processed">尚未处理</span>
                </el-descriptions-item>

                <el-descriptions-item label="触发方式" v-if="task.trigger_type">
                  <el-tag :type="task.trigger_type === 'manual' ? 'primary' : 'info'" size="small">
                    {{ task.trigger_type === 'manual' ? '手动同步' : '自动同步' }}
                  </el-tag>
                </el-descriptions-item>

                <!-- 手动同步的集群信息 -->
                <el-descriptions-item
                  label="同步集群"
                  v-if="task.trigger_type === 'manual' && task.cluster_ids"
                >
                  <div class="sync-cluster-info">
                    <div class="cluster-tags">
                      <el-tag
                        v-for="clusterId in getClusterIds(task.cluster_ids)"
                        :key="clusterId"
                        size="small"
                        class="cluster-tag"
                      >
                        {{ clusterId }}
                      </el-tag>
                    </div>
                    <div class="sync-summary">同步结果: {{ getSyncSummary(task) }}</div>
                  </div>
                </el-descriptions-item>
              </el-descriptions>

              <!-- Error Message -->
              <div v-if="task.error" class="error-section">
                <el-divider content-position="left">错误详情</el-divider>
                <el-alert :title="task.error" type="error" show-icon :closable="false" />
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card>
              <template #header>
                <span>操作</span>
              </template>

              <div class="action-section">
                <el-button
                  v-if="task.status === 'failed'"
                  type="primary"
                  @click="retryTask"
                  :loading="retrying"
                  class="action-button"
                >
                  <el-icon><RefreshRight /></el-icon>
                  重试任务
                </el-button>

                <el-button @click="refreshTask" :loading="refreshing" class="action-button">
                  <el-icon><Refresh /></el-icon>
                  刷新状态
                </el-button>

                <el-button @click="viewEntity" class="action-button">
                  <el-icon><User /></el-icon>
                  查看账户
                </el-button>
              </div>
            </el-card>

            <!-- Task Timeline -->
            <el-card class="timeline-card">
              <template #header>
                <span>时间线</span>
              </template>

              <el-timeline>
                <el-timeline-item timestamp="Created" :hollow="true" type="info">
                  <div class="timeline-item">
                    <div class="timeline-title">任务已创建</div>
                    <div class="timeline-time">{{ formatDateTime(task.created_at) }}</div>
                  </div>
                </el-timeline-item>

                <el-timeline-item
                  v-if="task.retries > 0"
                  v-for="n in task.retries"
                  :key="`retry-${n}`"
                  timestamp="Retry"
                  type="warning"
                >
                  <div class="timeline-item">
                    <div class="timeline-title">重试尝试 {{ n }}</div>
                    <div class="timeline-desc">任务已自动重试</div>
                  </div>
                </el-timeline-item>

                <el-timeline-item
                  v-if="task.completed_at"
                  timestamp="Processed"
                  :type="task.status === 'completed' ? 'success' : 'danger'"
                >
                  <div class="timeline-item">
                    <div class="timeline-title">
                      {{ task.status === 'completed' ? '任务已完成' : '任务失败' }}
                    </div>
                    <div class="timeline-time">{{ formatDateTime(task.completed_at) }}</div>
                    <div v-if="task.error" class="timeline-error">
                      {{ task.error }}
                    </div>
                  </div>
                </el-timeline-item>

                <el-timeline-item
                  v-else-if="task.status === 'processing'"
                  timestamp="Processing"
                  type="primary"
                >
                  <div class="timeline-item">
                    <div class="timeline-title">
                      <el-icon class="rotating"><Loading /></el-icon>
                      处理中...
                    </div>
                    <div class="timeline-desc">任务正在处理中</div>
                  </div>
                </el-timeline-item>

                <el-timeline-item
                  v-else-if="task.status === 'pending'"
                  timestamp="Pending"
                  type="info"
                  :hollow="true"
                >
                  <div class="timeline-item">
                    <div class="timeline-title">等待处理</div>
                    <div class="timeline-desc">任务在队列中</div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>

        <!-- Sync Results -->
        <el-row v-if="task.sync_results" style="margin-top: 20px">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>同步结果</span>
              </template>

              <div class="sync-results">
                <!-- Summary -->
                <div v-if="task.sync_results.summary" class="sync-summary">
                  <el-tag type="primary" size="large">
                    总计: {{ task.sync_results.summary.total }}
                  </el-tag>
                  <el-tag type="success" size="large" style="margin-left: 12px">
                    成功: {{ task.sync_results.summary.success }}
                  </el-tag>
                  <el-tag type="danger" size="large" style="margin-left: 12px">
                    失败: {{ task.sync_results.summary.failed }}
                  </el-tag>
                  <span class="sync-time" v-if="task.sync_results.summary.timestamp">
                    同步时间: {{ task.sync_results.summary.timestamp }}
                  </span>
                </div>

                <!-- Cluster Details -->
                <div class="cluster-results" style="margin-top: 20px">
                  <el-table
                    :data="getClusterSyncResults(task.sync_results)"
                    stripe
                    style="width: 100%"
                  >
                    <el-table-column prop="cluster_name" label="集群名称" width="200" />
                    <el-table-column prop="cluster_id" label="集群ID" width="280">
                      <template #default="{ row }">
                        <code>{{ row.cluster_id }}</code>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="{ row }">
                        <el-tag
                          :type="row.status === 'success' ? 'success' : 'danger'"
                          size="small"
                        >
                          {{ row.status === 'success' ? '成功' : '失败' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="message" label="结果消息" />
                    <el-table-column prop="timestamp" label="时间" width="160" />
                  </el-table>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Payload Information -->
        <el-row style="margin-top: 20px">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>任务载荷</span>
              </template>

              <div v-if="task.payload">
                <pre class="payload-content">{{ JSON.stringify(task.payload, null, 2) }}</pre>
              </div>
              <div v-else class="no-payload">
                <el-empty description="无载荷数据可用" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-else-if="!loading" class="task-not-found">
        <el-empty description="任务未找到" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtTaskApi } from '@/api/jwt-tasks'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  ArrowLeft,
  DocumentCopy,
  Calendar,
  RefreshRight,
  Refresh,
  User,
  Avatar,
  Loading,
} from '@element-plus/icons-vue'
import type { JWTTask } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const retrying = ref(false)
const refreshing = ref(false)
const task = ref<JWTTask | null>(null)

const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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

const getClusterIds = (clusterIdsData: Record<string, any>) => {
  if (clusterIdsData && clusterIdsData.cluster_ids) {
    return Array.isArray(clusterIdsData.cluster_ids) ? clusterIdsData.cluster_ids : []
  }
  return []
}

const getSyncSummary = (task: JWTTask) => {
  if (task.trigger_type !== 'manual' || !task.cluster_ids) {
    return ''
  }

  const totalClusters = getClusterIds(task.cluster_ids).length
  let successCount = 0

  // 检查同步结果
  if (task.sync_results) {
    // 这里需要根据实际的 sync_results 结构来计算成功数量
    // 现在先根据任务状态简单判断
    if (task.status === 'completed') {
      successCount = totalClusters
    } else if (task.status === 'failed' || task.status === 'processing') {
      successCount = 0 // 可以根据具体的 sync_results 来计算部分成功
    }
  }

  return `${successCount}/${totalClusters}`
}

const getClusterSyncResults = (syncResults: Record<string, any>) => {
  const results = []

  for (const [key, value] of Object.entries(syncResults)) {
    // 跳过summary字段
    if (key === 'summary') continue

    if (value && typeof value === 'object') {
      results.push({
        cluster_id: key,
        cluster_name: value.cluster_name || '未知集群',
        status: value.status || 'unknown',
        message: value.message || '',
        timestamp: value.timestamp || '',
      })
    }
  }

  return results
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const fetchTask = async () => {
  if (!route.params.id) return

  loading.value = true
  try {
    const response = await jwtTaskApi.getTask(route.params.id as string)
    task.value = response // 直接赋值，不用 response.data
    console.log('Task loaded:', task.value) // 调试日志
  } catch (error) {
    console.error('Failed to fetch task:', error)
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

const retryTask = async () => {
  if (!task.value) return

  retrying.value = true
  try {
    await jwtTaskApi.retryTask(task.value.id)
    ElMessage.success('任务已排队重试')

    // Update task status
    task.value.status = 'pending'
    task.value.retries += 1
  } catch (error) {
    console.error('Failed to retry task:', error)
  } finally {
    retrying.value = false
  }
}

const refreshTask = async () => {
  refreshing.value = true
  await fetchTask()
  refreshing.value = false
}

const viewEntity = () => {
  if (!task.value) return
  router.push(`/accounts/${task.value.entity_id}/edit`)
}

onMounted(() => {
  fetchTask()
})
</script>

<style scoped lang="scss">
.jwt-task-detail {
  padding: 24px;
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
    max-width: 100%;
  }
}

.datetime-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.sync-cluster-info {
  .cluster-tags {
    margin-bottom: 8px;

    .cluster-tag {
      margin-right: 8px;
      margin-bottom: 4px;
    }
  }

  .sync-summary {
    font-size: 13px;
    color: var(--el-text-color-regular);
    font-weight: 500;
  }
}

.not-processed {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.error-section {
  margin-top: 24px;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-button {
    width: 100%;
  }
}

.timeline-card {
  margin-top: 24px;
}

.timeline-item {
  .timeline-title {
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  .timeline-time {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }

  .timeline-desc {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  .timeline-error {
    font-size: 13px;
    color: var(--el-color-danger);
    margin-top: 6px;
    padding: 8px 12px;
    background: var(--el-color-danger-light-9);
    border-radius: 6px;
    line-height: 1.4;
  }
}

.payload-content {
  background: var(--el-bg-color-page);
  padding: 20px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.no-payload {
  padding: 40px 0;
  text-align: center;
}

.sync-results {
  .sync-summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;

    .sync-time {
      margin-left: 20px;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .cluster-results {
    :deep(.el-table) {
      font-size: 14px;

      .el-table__cell {
        padding: 12px 0;
      }

      code {
        background: var(--el-bg-color-page);
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
      }
    }
  }
}

:deep(.el-card) {
  margin-bottom: 24px;

  .el-card__header {
    padding: 20px;
  }

  .el-card__body {
    padding: 20px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.el-descriptions) {
  .el-descriptions__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
    width: 120px;
  }

  .el-descriptions__content {
    color: var(--el-text-color-regular);
  }

  .el-descriptions-item__cell {
    padding: 12px 16px;
  }
}

.task-not-found {
  padding: 60px 0;
  text-align: center;
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

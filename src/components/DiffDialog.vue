<template>
  <el-dialog
    v-model="dialogVisible"
    title="配置差异对比"
    width="90%"
    :before-close="handleClose"
    destroy-on-close
    class="diff-dialog"
  >
    <div v-loading="loading" class="diff-container">
      <div v-if="!loading && diffData" class="diff-content">
        <div class="diff-header">
          <div class="diff-info">
            <el-tag type="info" size="small">JetStream: {{ jetStreamName }}</el-tag>
            <el-tag :type="diffData.has_difference ? 'warning' : 'success'" size="small">
              {{ diffData.has_difference ? '存在差异' : '配置一致' }}
            </el-tag>
          </div>
          <div class="diff-timestamp">
            <span class="timestamp-label">检查时间:</span>
            <span class="timestamp-value">{{ new Date().toLocaleString() }}</span>
          </div>
        </div>

        <div v-if="diffData.has_difference && diffData.differences?.length" class="diff-summary">
          <h4>配置差异详情 ({{ diffData.differences.length }} 项)</h4>
          <ul>
            <li v-for="change in diffData.differences" :key="change.field">
              <span class="change-path">{{ change.field }}</span>
              <div class="change-values">
                <span class="old-value">数据库: {{ formatValue(change.database_value) }}</span>
                <span class="arrow">→</span>
                <span class="new-value">集群: {{ formatValue(change.cluster_value) }}</span>
              </div>
            </li>
          </ul>
        </div>

        <DiffViewer
          :database-config="diffData.database_config"
          :cluster-config="diffData.cluster_config"
          :has-differences="diffData.has_difference"
          :differences="diffData.differences"
        />
      </div>

      <div v-else-if="!loading && error" class="error-container">
        <el-result icon="error" title="获取差异信息失败" :sub-title="error">
          <template #extra>
            <el-button type="primary" @click="fetchDiff">重试</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="fetchDiff" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新差异
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import DiffViewer from './DiffViewer.vue'
import { formatDateTime } from '@/utils'
import { getJetStreamDiff } from '@/api/jetstreams'

interface DiffData {
  has_difference: boolean
  database_config: any
  cluster_config: any
  differences: Array<{
    field: string
    database_value: any
    cluster_value: any
  }>
}

interface Props {
  visible: boolean
  jetStreamId: string
  jetStreamName: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const loading = ref(false)
const diffData = ref<DiffData | null>(null)
const error = ref<string>('')

watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
    if (newValue && props.jetStreamId) {
      fetchDiff()
    }
  }
)

watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('update:visible', false)
  }
})

const fetchDiff = async () => {
  if (!props.jetStreamId) return

  loading.value = true
  error.value = ''

  try {
    const response = await getJetStreamDiff(props.jetStreamId)
    // API函数已经返回了data，不需要再取.data
    diffData.value = response
  } catch (err: any) {
    console.error('获取diff失败:', err)

    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = '获取配置差异失败'
    }

    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const getChangeType = (type: string) => {
  switch (type) {
    case 'added':
      return 'success'
    case 'removed':
      return 'danger'
    case 'modified':
      return 'warning'
    default:
      return 'info'
  }
}

const formatValue = (value: any) => {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
</script>

<style scoped>
.diff-dialog {
  max-width: 1400px;

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.diff-container {
  min-height: 400px;
}

.diff-content {
  padding: 20px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;

  .diff-info {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .diff-timestamp {
    font-size: 13px;
    color: var(--el-text-color-secondary);

    .timestamp-label {
      margin-right: 8px;
    }

    .timestamp-value {
      font-family: monospace;
      color: var(--el-text-color-primary);
    }
  }
}

.diff-summary {
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 6px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .change-path {
      font-family: monospace;
      font-size: 12px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .change-values {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;

      .old-value {
        color: var(--el-color-danger);
        font-family: monospace;
      }

      .arrow {
        color: var(--el-text-color-secondary);
      }

      .new-value {
        color: var(--el-color-success);
        font-family: monospace;
      }
    }
  }
}

.diff-error {
  margin-top: 20px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

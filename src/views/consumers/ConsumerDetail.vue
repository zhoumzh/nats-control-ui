<template>
  <div class="consumer-detail">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="info" link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      <div class="header-right">
        <el-button @click="handleSync" :loading="syncing">
          <el-icon><Refresh /></el-icon>
          同步状态
        </el-button>
        <el-button @click="handlePauseResume" :loading="pauseResuming">
          <el-icon><VideoPlay v-if="consumer?.paused" /><VideoPause v-else /></el-icon>
          {{ consumer?.paused ? '恢复' : '暂停' }}
        </el-button>
        <el-button @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-dropdown trigger="click">
          <el-button type="primary">
            操作 <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleCopy">
                <el-icon><CopyDocument /></el-icon>
                复制配置
              </el-dropdown-item>
              <el-dropdown-item @click="handleDelete" class="danger" divided>
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- Content -->
    <div v-else-if="consumer" class="detail-content">
      <!-- Basic Information -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>{{ consumer.name }} - Consumer 详情</h3>
            <div class="status-tags">
              <el-tag :type="getStatusTagType(consumer.status)">
                {{ getStatusText(consumer.status) }}
              </el-tag>
              <el-tag :type="getSyncStatusTagType(consumer.sync_status)">
                {{ getSyncStatusText(consumer.sync_status) }}
              </el-tag>
              <el-tag v-if="consumer.paused" type="warning"> 已暂停 </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">
            <span class="primary-text">{{ consumer.name }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="ID">
            <el-text type="info" size="small">{{ consumer.id }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ consumer.description || '无描述' }}
          </el-descriptions-item>

          <!-- 同步状态信息 -->
          <el-descriptions-item label="同步状态" :span="2">
            <div class="sync-status-info">
              <el-tag :type="getSyncStatusTagType(consumer.sync_status)" size="large">
                {{ getSyncStatusText(consumer.sync_status) }}
              </el-tag>
              <span v-if="consumer.sync_message" class="sync-message">
                {{ consumer.sync_message }}
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="consumer.sync_status === 'failed' && consumer.sync_failure_reason"
            label="失败原因"
            :span="2"
          >
            <el-alert
              :title="consumer.sync_failure_reason"
              type="error"
              :closable="false"
              show-icon
            />
          </el-descriptions-item>

          <el-descriptions-item label="JetStream">
            <span v-if="jetstreamName">{{ jetstreamName }}</span>
            <span v-else class="text-muted">{{ consumer.jetstream_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="集群">
            <span v-if="clusterName">{{ clusterName }}</span>
            <span v-else class="text-muted">{{ consumer.cluster_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="暂停状态">
            <el-tag :type="consumer.paused ? 'warning' : 'success'">
              {{ consumer.paused ? '是' : '否' }}
            </el-tag>
            <span v-if="consumer.paused && consumer.pause_until" class="ml-2">
              暂停至: {{ formatDateTime(consumer.pause_until) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(consumer.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ formatDateTime(consumer.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Consumer Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>Consumer 配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="持久化">
            <el-tag :type="consumer.durable ? 'success' : 'info'">
              {{ consumer.durable ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="确认策略">
            <el-tag effect="plain">{{ getAckPolicyText(consumer.ack_policy) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="确认等待时间">
            {{ formatDuration(consumer.ack_wait) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大投递次数">
            {{ formatLimit(consumer.max_deliver) }}
          </el-descriptions-item>
          <el-descriptions-item label="过滤主题">
            {{ consumer.filter_subject || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="重放策略">
            <el-tag effect="plain">{{ getReplayPolicyText(consumer.replay_policy) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="采样频率" :span="2">
            {{ consumer.sample_freq || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Flow Control -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>流量控制</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="速率限制">
            {{ formatRateLimit(consumer.rate_limit) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大待确认">
            {{ formatNumber(consumer.max_ack_pending) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大等待">
            {{ formatNumber(consumer.max_waiting) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大批量">
            {{ formatNumber(consumer.max_batch) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大过期时间" :span="2">
            {{ formatNanoseconds(consumer.max_expires) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Advanced Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>高级配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="不活跃阈值">
            {{ formatDuration(consumer.inactive_threshold) }}
          </el-descriptions-item>
          <el-descriptions-item label="投递策略">
            <el-tag effect="plain">{{ getDeliverPolicyText(consumer.deliver_policy) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="consumer.opt_start_seq" label="起始序号">
            {{ formatNumber(consumer.opt_start_seq) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="consumer.opt_start_time" label="起始时间">
            {{ formatDateTime(consumer.opt_start_time) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="consumer.deliver_subject" label="投递主题">
            {{ consumer.deliver_subject }}
          </el-descriptions-item>
          <el-descriptions-item v-if="consumer.deliver_group" label="投递组">
            {{ consumer.deliver_group }}
          </el-descriptions-item>
          <el-descriptions-item label="流控制">
            <el-tag :type="consumer.flow_control ? 'success' : 'info'">
              {{ consumer.flow_control ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="空闲心跳">
            {{ formatDuration(consumer.idle_heartbeat) }}
          </el-descriptions-item>
          <el-descriptions-item label="仅头部">
            <el-tag :type="consumer.headers_only ? 'warning' : 'info'">
              {{ consumer.headers_only ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最大请求批量">
            {{ formatNumber(consumer.max_request_batch) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大请求过期">
            {{ formatNanoseconds(consumer.max_request_expires) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大请求字节">
            {{ formatBytes(consumer.max_request_max_bytes) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Storage Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>存储配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="内存存储">
            <el-tag :type="consumer.mem_storage ? 'warning' : 'success'">
              {{ consumer.mem_storage ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="副本数量">
            {{ consumer.replicas }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Statistics -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>统计信息</h3>
            <el-text type="info" size="small"> 最后同步: {{ lastSyncTime }} </el-text>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(consumer.delivered_count) }}</div>
              <div class="stat-label">已投递消息数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(consumer.ack_pending_count) }}</div>
              <div class="stat-label">待确认消息数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(consumer.redelivered_count) }}</div>
              <div class="stat-label">重新投递消息数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ formatNumber(consumer.num_pending) }}</div>
              <div class="stat-label">待处理消息数</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- Error -->
    <el-alert
      v-else-if="error"
      title="加载失败"
      :description="error"
      type="error"
      show-icon
      :closable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  Edit,
  ArrowDown,
  CopyDocument,
  Delete,
  VideoPlay,
  VideoPause,
} from '@element-plus/icons-vue'
import { useConsumerStore } from '@/stores/consumers'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useClusterStore } from '@/stores/clusters'
import { ConsumerSyncStatus } from '@/types'
import type {
  ConsumerStatus,
  ConsumerAckPolicy,
  ConsumerReplayPolicy,
  ConsumerDeliverPolicy,
} from '@/types'
import { formatDateTime, formatNumber, formatBytes } from '@/utils'

const route = useRoute()
const router = useRouter()
const consumerStore = useConsumerStore()
const jetstreamStore = useJetStreamStore()
const clusterStore = useClusterStore()

// State
const syncing = ref(false)
const pauseResuming = ref(false)
const lastSyncTime = ref('')

// Computed
const consumerId = computed(() => route.params.id as string)
const consumer = computed(() => consumerStore.currentConsumer)
const loading = computed(() => consumerStore.loading)
const error = computed(() => consumerStore.error)

// 根据ID查找关联的JetStream和Cluster名称
const jetstreamName = computed(() => {
  if (!consumer.value?.jetstream_id) return null
  const jetstream = jetstreamStore.jetstreams.find((j) => j.id === consumer.value!.jetstream_id)
  return jetstream ? jetstream.name : null
})

const clusterName = computed(() => {
  if (!consumer.value?.cluster_id) return null
  const cluster = clusterStore.clusters.find((c) => c.id === consumer.value!.cluster_id)
  return cluster ? cluster.name : null
})

// Methods
const loadConsumer = async () => {
  try {
    // 并行加载 Consumer、JetStreams 和 Clusters 数据
    await Promise.all([
      consumerStore.fetchConsumer(consumerId.value),
      jetstreamStore.fetchJetStreams(),
      clusterStore.fetchClusters(),
    ])
    updateLastSyncTime()
  } catch (error) {
    console.error('Failed to load Consumer:', error)
  }
}

const updateLastSyncTime = () => {
  lastSyncTime.value = new Date().toLocaleString()
}

const handleSync = async () => {
  try {
    syncing.value = true
    await consumerStore.retryConsumerSync(consumerId.value)
    updateLastSyncTime()

    ElMessage.success('状态同步成功')
  } catch (error) {
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const handlePauseResume = async () => {
  if (!consumer.value) return

  try {
    pauseResuming.value = true

    if (consumer.value.paused) {
      await consumerStore.resumeConsumer(consumerId.value)
      ElMessage.success('Consumer 已恢复')
    } else {
      await consumerStore.pauseConsumer(consumerId.value)
      ElMessage.success('Consumer 已暂停')
    }
  } catch (error) {
    ElMessage.error(`${consumer.value.paused ? '恢复' : '暂停'}失败`)
  } finally {
    pauseResuming.value = false
  }
}

const handleEdit = () => {
  router.push(`/consumers/${consumerId.value}/edit`)
}

const handleCopy = () => {
  if (!consumer.value) return

  const config = {
    name: `${consumer.value.name}_copy`,
    description: consumer.value.description,
    jetstream_id: consumer.value.jetstream_id,
    durable: consumer.value.durable,
    ack_policy: consumer.value.ack_policy,
    ack_wait: consumer.value.ack_wait,
    max_deliver: consumer.value.max_deliver,
    filter_subject: consumer.value.filter_subject,
    replay_policy: consumer.value.replay_policy,
    sample_freq: consumer.value.sample_freq,
    rate_limit: consumer.value.rate_limit,
    max_ack_pending: consumer.value.max_ack_pending,
    max_waiting: consumer.value.max_waiting,
    max_batch: consumer.value.max_batch,
    max_expires: consumer.value.max_expires,
    inactive_threshold: consumer.value.inactive_threshold,
    deliver_policy: consumer.value.deliver_policy,
    opt_start_seq: consumer.value.opt_start_seq,
    opt_start_time: consumer.value.opt_start_time,
    deliver_subject: consumer.value.deliver_subject,
    deliver_group: consumer.value.deliver_group,
    flow_control: consumer.value.flow_control,
    idle_heartbeat: consumer.value.idle_heartbeat,
    headers_only: consumer.value.headers_only,
    max_request_batch: consumer.value.max_request_batch,
    max_request_expires: consumer.value.max_request_expires,
    max_request_max_bytes: consumer.value.max_request_max_bytes,
    mem_storage: consumer.value.mem_storage,
    replicas: consumer.value.replicas,
  }

  router.push({
    path: '/consumers/create',
    query: { copy: JSON.stringify(config) },
  })
}

const handleDelete = async () => {
  if (!consumer.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除 Consumer "${consumer.value.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    await consumerStore.deleteConsumer(consumerId.value)
    ElMessage.success('删除成功')
    router.push('/consumers')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const goBack = () => {
  router.push('/consumers')
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
    case ConsumerSyncStatus.SYNCED:
      return 'success'
    case ConsumerSyncStatus.PENDING:
      return 'info'
    case ConsumerSyncStatus.SYNCING:
      return 'warning'
    case ConsumerSyncStatus.FAILED:
      return 'danger'
    default:
      return 'info'
  }
}

const getSyncStatusText = (syncStatus: ConsumerSyncStatus) => {
  switch (syncStatus) {
    case ConsumerSyncStatus.SYNCED:
      return '已同步'
    case ConsumerSyncStatus.PENDING:
      return '待同步'
    case ConsumerSyncStatus.SYNCING:
      return '同步中'
    case ConsumerSyncStatus.FAILED:
      return '同步失败'
    default:
      return syncStatus
  }
}

const getAckPolicyText = (policy: ConsumerAckPolicy) => {
  switch (policy) {
    case 'explicit':
      return '显式确认'
    case 'all':
      return '全部确认'
    case 'none':
      return '无需确认'
    default:
      return policy
  }
}

const getReplayPolicyText = (policy: ConsumerReplayPolicy) => {
  switch (policy) {
    case 'instant':
      return '立即重放'
    case 'original':
      return '按原速重放'
    default:
      return policy
  }
}

const getDeliverPolicyText = (policy: ConsumerDeliverPolicy) => {
  switch (policy) {
    case 'all':
      return '所有消息'
    case 'last':
      return '最后一条'
    case 'new':
      return '新消息'
    case 'by_start_sequence':
      return '从指定序号'
    case 'by_start_time':
      return '从指定时间'
    case 'last_per_subject':
      return '每个主题最后一条'
    default:
      return policy
  }
}

const formatDuration = (seconds: number) => {
  if (seconds === 0) return '0 秒'
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
  return `${Math.floor(seconds / 86400)} 天`
}

const formatLimit = (value: number) => {
  if (value === -1) return '无限制'
  return formatNumber(value)
}

const formatRateLimit = (bytesPerSecond: number) => {
  if (bytesPerSecond === 0) return '无限制'
  return `${formatBytes(bytesPerSecond)}/秒`
}

const formatNanoseconds = (nanoseconds: number) => {
  if (nanoseconds === 0) return '无'
  const seconds = nanoseconds / 1000000000
  return formatDuration(seconds)
}

// Lifecycle
onMounted(() => {
  loadConsumer()
})
</script>

<style scoped>
.consumer-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.loading-container {
  padding: 40px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.status-tags {
  display: flex;
  gap: 8px;
}

.sync-status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-message {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.primary-text {
  color: var(--el-color-primary);
  font-weight: 600;
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.ml-2 {
  margin-left: 8px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.stat-label {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-detail {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.danger {
  color: var(--el-color-danger);
}
</style>

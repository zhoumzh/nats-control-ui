<template>
  <div class="jetstream-detail">
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
    <div v-else-if="jetstream" class="detail-content">
      <!-- Basic Information -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>{{ jetstream.name }} - JetStream 详情</h3>
            <div class="status-tags">
              <el-tag :type="getStatusTagType(jetstream.status)">
                {{ getStatusText(jetstream.status) }}
              </el-tag>
              <el-tag :type="getSyncStatusTagType(jetstream.sync_status)">
                {{ getSyncStatusText(jetstream.sync_status) }}
              </el-tag>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">
            <span class="primary-text">{{ jetstream.name }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="ID">
            <el-text type="info" size="small">{{ jetstream.id }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ jetstream.description || '无描述' }}
          </el-descriptions-item>

          <!-- 同步状态信息 -->
          <el-descriptions-item label="同步状态" :span="2">
            <div class="sync-status-info">
              <el-tag :type="getSyncStatusTagType(jetstream.sync_status)" size="large">
                {{ getSyncStatusText(jetstream.sync_status) }}
              </el-tag>
              <span v-if="jetstream.sync_message" class="sync-message">
                {{ jetstream.sync_message }}
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="jetstream.sync_status === 'sync_failed' && jetstream.sync_failure_reason"
            label="失败原因"
            :span="2"
          >
            <el-alert
              :title="jetstream.sync_failure_reason"
              type="error"
              :closable="false"
              show-icon
            />
          </el-descriptions-item>

          <el-descriptions-item label="操作nats用户">
            <div v-if="natsOperateUserName">
              <span>{{ natsOperateUserName }}</span>
            </div>
            <span v-else class="text-muted">{{ jetstream.nats_operate_user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="集群">
            <span v-if="clusterName">{{ clusterName }}</span>
            <span v-else class="text-muted">{{ jetstream.cluster_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(jetstream.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(jetstream.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Stream Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>流配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="Subjects" :span="2">
            <div class="subjects-display">
              <el-tag v-for="subject in jetstream.subjects" :key="subject" class="subject-tag">
                {{ subject }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="存储类型">
            <el-tag effect="plain">{{ getStorageText(jetstream.storage) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="保留策略">
            <el-tag effect="plain">{{ getRetentionText(jetstream.retention) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="丢弃策略">
            <el-tag effect="plain">{{ getDiscardText(jetstream.discard) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="压缩类型">
            <el-tag effect="plain">{{ getCompressionText(jetstream.compression) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Limits Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>限制配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="最大消息数">
            {{ formatLimit(jetstream.max_msgs) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大字节数">
            {{ formatStorageSize(jetstream.max_bytes_value, jetstream.max_bytes_unit) }}
          </el-descriptions-item>
          <el-descriptions-item label="消息存活时间">
            {{ formatDuration(jetstream.max_age) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大消息大小">
            {{ formatStorageSize(jetstream.max_msg_size_value, jetstream.max_msg_size_unit) }}
          </el-descriptions-item>
          <el-descriptions-item label="最大消费者数">
            {{ formatLimit(jetstream.max_consumers) }}
          </el-descriptions-item>
          <el-descriptions-item label="副本数量">
            {{ jetstream.replicas }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Persistence Configuration -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <h3>持久化配置</h3>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="禁用确认">
            <el-tag :type="jetstream.no_ack ? 'warning' : 'success'">
              {{ jetstream.no_ack ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="重复检测窗口">
            {{ formatDuration(jetstream.duplicate_window) }}
          </el-descriptions-item>
          <el-descriptions-item label="允许汇总标头">
            <el-tag :type="jetstream.allow_rollup_hdrs ? 'success' : 'info'">
              {{ jetstream.allow_rollup_hdrs ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="允许直接访问">
            <el-tag :type="jetstream.allow_direct ? 'success' : 'info'">
              {{ jetstream.allow_direct ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="镜像直接访问">
            <el-tag :type="jetstream.mirror_direct ? 'success' : 'info'">
              {{ jetstream.mirror_direct ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="禁止删除">
            <el-tag :type="jetstream.deny_delete ? 'warning' : 'info'">
              {{ jetstream.deny_delete ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="禁止清除">
            <el-tag :type="jetstream.deny_purge ? 'warning' : 'info'">
              {{ jetstream.deny_purge ? '是' : '否' }}
            </el-tag>
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
              <div class="stat-number">{{ formatNumber(jetstream.messages) }}</div>
              <div class="stat-label">消息总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">
                {{ formatStorageSize(jetstream.bytes_value, jetstream.bytes_unit) }}
              </div>
              <div class="stat-label">存储大小</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ jetstream.num_consumers }}</div>
              <div class="stat-label">消费者数量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ jetstream.last_seq - jetstream.first_seq + 1 }}</div>
              <div class="stat-label">序列范围</div>
              <div class="stat-detail">{{ jetstream.first_seq }} - {{ jetstream.last_seq }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- Placement Configuration -->
      <el-card
        v-if="jetstream.placement_cluster || jetstream.placement_tags?.length"
        class="info-card"
        shadow="never"
      >
        <template #header>
          <h3>放置配置</h3>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item v-if="jetstream.placement_cluster" label="指定集群">
            {{ jetstream.placement_cluster }}
          </el-descriptions-item>
          <el-descriptions-item v-if="jetstream.placement_tags?.length" label="放置标签">
            <div class="tags-display">
              <el-tag v-for="tag in jetstream.placement_tags" :key="tag" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Metadata -->
      <el-card
        v-if="jetstream.metadata && Object.keys(jetstream.metadata).length"
        class="info-card"
        shadow="never"
      >
        <template #header>
          <h3>元数据</h3>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="(value, key) in jetstream.metadata" :key="key" :label="key">
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
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
import { ArrowLeft, Refresh, Edit, ArrowDown, CopyDocument, Delete } from '@element-plus/icons-vue'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useUserStore } from '@/stores/users'
import { useClusterStore } from '@/stores/clusters'
import { JetStreamSyncStatus } from '@/types'
import type {
  JetStreamStatus,
  JetStreamStorageType,
  JetStreamRetentionPolicy,
  JetStreamDiscardPolicy,
  JetStreamCompressionType,
} from '@/types'
import { formatDateTime, formatNumber, formatBytes } from '@/utils'
import { formatStorage } from '@/utils/storage'
import type { StorageUnit } from '@/types'

const route = useRoute()
const router = useRouter()
const jetStreamStore = useJetStreamStore()
const userStore = useUserStore()
const clusterStore = useClusterStore()

// State
const syncing = ref(false)
const lastSyncTime = ref('')

// Computed
const jetStreamId = computed(() => route.params.id as string)
const jetstream = computed(() => jetStreamStore.currentJetStream)
const loading = computed(() => jetStreamStore.loading)
const error = computed(() => jetStreamStore.error)

// 根据ID查找关联的用户和集群名称
const natsOperateUserName = computed(() => {
  if (!jetstream.value?.nats_operate_user_id) return null
  const user = userStore.users.find((u) => u.id === jetstream.value!.nats_operate_user_id)
  return user ? user.name : null
})

const clusterName = computed(() => {
  if (!jetstream.value?.cluster_id) return null
  const cluster = clusterStore.clusters.find((c) => c.id === jetstream.value!.cluster_id)
  return cluster ? cluster.name : null
})

// Methods
const loadJetStream = async () => {
  try {
    // 并行加载 JetStream、Users 和 Clusters 数据
    await Promise.all([
      jetStreamStore.fetchJetStream(jetStreamId.value),
      userStore.fetchUsers(),
      clusterStore.fetchClusters(),
    ])
    updateLastSyncTime()
  } catch (error) {
    console.error('Failed to load JetStream:', error)
  }
}

const updateLastSyncTime = () => {
  lastSyncTime.value = new Date().toLocaleString()
}

const handleSync = async () => {
  try {
    syncing.value = true
    const updatedJetStream = await jetStreamStore.syncJetStreamStatus(jetStreamId.value)
    updateLastSyncTime()

    ElMessage.success('状态同步成功')
  } catch (error) {
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const handleEdit = () => {
  router.push(`/jetstreams/${jetStreamId.value}/edit`)
}

const handleCopy = () => {
  if (!jetstream.value) return

  const config = {
    name: `${jetstream.value.name}_copy`,
    description: jetstream.value.description,
    nats_operate_user_id: jetstream.value.nats_operate_user_id,
    cluster_id: jetstream.value.cluster_id,
    subjects: [...jetstream.value.subjects],
    storage: jetstream.value.storage,
    retention: jetstream.value.retention,
    discard: jetstream.value.discard,
    compression: jetstream.value.compression,
    max_msgs: jetstream.value.max_msgs,
    max_bytes_value: jetstream.value.max_bytes_value,
    max_bytes_unit: jetstream.value.max_bytes_unit,
    max_age: jetstream.value.max_age,
    max_msg_size_value: jetstream.value.max_msg_size_value,
    max_msg_size_unit: jetstream.value.max_msg_size_unit,
    max_consumers: jetstream.value.max_consumers,
    replicas: jetstream.value.replicas,
    no_ack: jetstream.value.no_ack,
    duplicate_window: jetstream.value.duplicate_window,
    allow_rollup_hdrs: jetstream.value.allow_rollup_hdrs,
    allow_direct: jetstream.value.allow_direct,
    mirror_direct: jetstream.value.mirror_direct,
    deny_delete: jetstream.value.deny_delete,
    deny_purge: jetstream.value.deny_purge,
    placement_cluster: jetstream.value.placement_cluster,
    placement_tags: jetstream.value.placement_tags ? [...jetstream.value.placement_tags] : [],
    metadata: jetstream.value.metadata ? { ...jetstream.value.metadata } : {},
  }

  router.push({
    path: '/jetstreams/create',
    query: { copy: JSON.stringify(config) },
  })
}

const handleDelete = async () => {
  if (!jetstream.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除 JetStream "${jetstream.value.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    await jetStreamStore.deleteJetStream(jetStreamId.value)
    ElMessage.success('删除成功')
    router.push('/jetstreams')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const goBack = () => {
  router.push('/jetstreams')
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
      return '文件存储'
    case 'memory':
      return '内存存储'
    default:
      return storage
  }
}

const getRetentionText = (retention: JetStreamRetentionPolicy) => {
  switch (retention) {
    case 'limits':
      return '基于限制'
    case 'interest':
      return '基于兴趣'
    case 'workqueue':
      return '工作队列'
    default:
      return retention
  }
}

const getDiscardText = (discard: JetStreamDiscardPolicy) => {
  switch (discard) {
    case 'old':
      return '丢弃旧消息'
    case 'new':
      return '丢弃新消息'
    default:
      return discard
  }
}

const getCompressionText = (compression: JetStreamCompressionType) => {
  switch (compression) {
    case 'none':
      return '无压缩'
    case 's2':
      return 'S2压缩'
    default:
      return compression
  }
}

const formatStorageSize = (value: number, unit: StorageUnit) => {
  if (value === -1) return '无限制'
  return formatStorage(value, unit)
}

const formatLimit = (value: number) => {
  if (value === -1) return '无限制'
  return formatNumber(value)
}

const formatDuration = (seconds: number) => {
  if (seconds === 0) return '永久'
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`
  return `${Math.floor(seconds / 86400)} 天`
}

const getSyncStatusTagType = (syncStatus: JetStreamSyncStatus) => {
  switch (syncStatus) {
    case JetStreamSyncStatus.SYNCED:
      return 'success'
    case JetStreamSyncStatus.UNSYNCED:
      return 'info'
    case JetStreamSyncStatus.SYNC_FAILED:
      return 'danger'
    default:
      return 'info'
  }
}

const getSyncStatusText = (syncStatus: JetStreamSyncStatus) => {
  switch (syncStatus) {
    case JetStreamSyncStatus.SYNCED:
      return '已同步'
    case JetStreamSyncStatus.UNSYNCED:
      return '未同步'
    case JetStreamSyncStatus.SYNC_FAILED:
      return '同步失败'
    default:
      return syncStatus
  }
}

// Lifecycle
onMounted(() => {
  loadJetStream()
})
</script>

<style scoped>
.jetstream-detail {
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

.subjects-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subject-tag {
  margin: 0;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

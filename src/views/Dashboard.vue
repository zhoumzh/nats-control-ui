<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>仪表板</h1>
      <p>NATS JWT RBAC 管理系统概览</p>
    </div>

    <!-- Statistics Cards - First Row -->
    <el-row :gutter="32" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/clusters')">
          <div class="stat-content clickable-card">
            <div class="stat-icon cluster">
              <img src="@/assets/icons/Nats.png" alt="集群" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ clusterStats.total }}</div>
              <div class="stat-label">集群总数</div>
              <div class="stat-detail">
                <span class="active">{{ clusterStats.active }} 活跃</span>
                <span class="disabled">{{ clusterStats.disabled }} 已禁用</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/accounts')">
          <div class="stat-content clickable-card">
            <div class="stat-icon account">
              <img :src="accountIcon" alt="账户" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ accountStats.total }}</div>
              <div class="stat-label">账户总数</div>
              <div class="stat-detail">
                <span class="active">{{ accountStats.active }} 活跃</span>
                <span class="disabled">{{ accountStats.disabled }} 已禁用</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/users')">
          <div class="stat-content clickable-card">
            <div class="stat-icon user">
              <el-icon size="32"><Avatar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStats.total }}</div>
              <div class="stat-label">用户总数</div>
              <div class="stat-detail">
                <span class="active">{{ userStats.active }} 活跃</span>
                <span class="disabled">{{ userStats.disabled }} 已禁用</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/jetstreams')">
          <div class="stat-content clickable-card">
            <div class="stat-icon jetstream">
              <img :src="jetstreamIcon" alt="JetStream" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ jetstreamStats.total }}</div>
              <div class="stat-label">JetStream总数</div>
              <div class="stat-detail">
                <span class="active">{{ jetstreamStats.active }} 活跃</span>
                <span class="disabled">{{ jetstreamStats.disabled }} 已禁用</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Statistics Cards - Second Row -->
    <el-row :gutter="32" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/consumers')">
          <div class="stat-content clickable-card">
            <div class="stat-icon consumer">
              <img src="@/assets/icons/consumer.png" alt="Consumer" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ consumerStats.total }}</div>
              <div class="stat-label">Consumer总数</div>
              <div class="stat-detail">
                <span class="active">{{ consumerStats.active }} 活跃</span>
                <span class="disabled">{{ consumerStats.disabled }} 已禁用</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="$router.push('/jwt-tasks')">
          <div class="stat-content clickable-card">
            <div class="stat-icon task">
              <el-icon size="32"><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskStats.total }}</div>
              <div class="stat-label">JWT任务</div>
              <div class="stat-detail">
                <span class="completed">{{ taskStats.completed }} 已完成</span>
                <span class="failed">{{ taskStats.failed }} 失败</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon sync">
              <el-icon size="32"><RefreshRight /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ syncStats.total }}</div>
              <div class="stat-label">同步统计</div>
              <div class="stat-detail">
                <span class="completed">{{ syncStats.synced }} 已同步</span>
                <span class="failed">{{ syncStats.failed }} 失败</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon health">
              <el-icon size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ healthStats.total }}</div>
              <div class="stat-label">健康状态</div>
              <div class="stat-detail">
                <span class="healthy">{{ healthStats.healthy }} 健康</span>
                <span class="unhealthy">{{ healthStats.unhealthy }} 异常</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Activities -->
    <el-row :gutter="32" class="content-row">
      <el-col :span="8">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>最近JetStream</span>
              <el-button text @click="$router.push('/jetstreams')"> 查看全部 </el-button>
            </div>
          </template>

          <div v-loading="jetstreamStore.loading" class="activity-list">
            <div
              v-for="jetstream in recentJetStreams"
              :key="jetstream.id"
              class="activity-item clickable"
              @click="goToJetStreamDetail(jetstream.id)"
            >
              <div class="activity-icon">
                <img src="@/assets/icons/stream-hasconsumer.png" alt="JetStream" />
              </div>
              <div class="activity-info">
                <div class="activity-title">{{ jetstream.name }}</div>
                <div class="activity-desc">{{ jetstream.description || '无描述' }}</div>
                <div class="activity-time">{{ formatTime(jetstream.created_at) }}</div>
              </div>
              <el-tag :type="jetstream.status === 'active' ? 'success' : 'danger'" size="small">
                {{ jetstream.status }}
              </el-tag>
            </div>
            <el-empty v-if="recentJetStreams.length === 0" description="暂无数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>最近Consumer</span>
              <el-button text @click="$router.push('/consumers')"> 查看全部 </el-button>
            </div>
          </template>

          <div v-loading="consumerStore.loading" class="activity-list">
            <div
              v-for="consumer in recentConsumers"
              :key="consumer.id"
              class="activity-item clickable"
              @click="goToConsumerDetail(consumer.id)"
            >
              <div class="activity-icon">
                <img src="@/assets/icons/consumer.png" alt="Consumer" />
              </div>
              <div class="activity-info">
                <div class="activity-title">{{ consumer.name }}</div>
                <div class="activity-desc">{{ consumer.description || '无描述' }}</div>
                <div class="activity-time">{{ formatTime(consumer.created_at) }}</div>
              </div>
              <el-tag :type="consumer.status === 'active' ? 'success' : 'danger'" size="small">
                {{ consumer.status }}
              </el-tag>
            </div>
            <el-empty v-if="recentConsumers.length === 0" description="暂无数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span>最近JWT任务</span>
              <el-button text @click="$router.push('/jwt-tasks')"> 查看全部 </el-button>
            </div>
          </template>

          <div v-loading="taskLoading" class="activity-list">
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="activity-item clickable"
              @click="goToTaskDetail(task.id)"
            >
              <div :class="['activity-icon', getTaskIconClass(task.status)]">
                <el-icon
                  ><DocumentChecked v-if="task.status === 'completed'" /><Loading
                    v-else-if="task.status === 'processing'" /><Warning v-else
                /></el-icon>
              </div>
              <div class="activity-info">
                <div class="activity-title">{{ task.entity_type }} {{ task.operation }}</div>
                <div class="activity-desc">{{ task.entity_type }} - {{ task.status }}</div>
                <div class="activity-time">{{ formatTime(task.updated_at) }}</div>
              </div>
              <el-tag :type="getTaskTagType(task.status)" size="small">
                {{ task.status }}
              </el-tag>
              <el-button
                v-if="task.status === 'failed'"
                type="primary"
                size="small"
                @click.stop="retryTask(task.id)"
                :loading="retryingTasks.includes(task.id)"
                style="margin-left: 8px"
              >
                重试
              </el-button>
            </div>
            <el-empty v-if="recentTasks.length === 0" description="暂无数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts'
import { useUserStore } from '@/stores/users'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useConsumerStore } from '@/stores/consumers'
import { useClusterStore } from '@/stores/clusters'
import { jwtTaskApi } from '@/api/jwt-tasks'
import dayjs from 'dayjs'
import {
  User,
  Avatar,
  DocumentChecked,
  Monitor,
  Warning,
  Loading,
  Postcard,
  Message,
  RefreshRight,
  CircleCheck,
} from '@element-plus/icons-vue'
import type { JWTTask } from '@/types'
import accountHastream from '@/assets/icons/account-hastream.png'
import accountEmpty from '@/assets/icons/account-empty.png'
import streamHasconsumer from '@/assets/icons/stream-hasconsumer.png'
import streamNoconsumer from '@/assets/icons/stream-noconsumer.png'

const router = useRouter()
const accountStore = useAccountStore()
const userStore = useUserStore()
const jetstreamStore = useJetStreamStore()
const consumerStore = useConsumerStore()
const clusterStore = useClusterStore()

const taskLoading = ref(false)
const retryingTasks = ref<string[]>([])
const recentTasks = ref<JWTTask[]>([])
const taskStats = ref({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  failed: 0,
})

const clusterStats = computed(() => {
  const clusters = clusterStore.clusters
  return {
    total: clusters.length,
    active: clusters.filter((c) => c.status === 'active').length,
    disabled: clusters.filter((c) => c.status === 'disabled').length,
  }
})

const accountStats = computed(() => {
  const accounts = accountStore.accounts
  return {
    total: accounts.length,
    active: accounts.filter((a) => a.status === 'active').length,
    disabled: accounts.filter((a) => a.status === 'disabled').length,
  }
})

const accountIcon = computed(() => {
  return accountStats.value.total > 0 ? accountHastream : accountEmpty
})

const userStats = computed(() => {
  const users = userStore.users
  return {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
  }
})

const jetstreamStats = computed(() => {
  const jetstreams = jetstreamStore.jetstreams
  return {
    total: jetstreams.length,
    active: jetstreams.filter((js) => js.status === 'active').length,
    disabled: jetstreams.filter((js) => js.status === 'disabled').length,
  }
})

const jetstreamIcon = computed(() => {
  return jetstreamStats.value.total > 0 ? streamHasconsumer : streamNoconsumer
})

const consumerStats = computed(() => {
  const consumers = consumerStore.consumers
  return {
    total: consumers.length,
    active: consumers.filter((c) => c.status === 'active').length,
    disabled: consumers.filter((c) => c.status === 'disabled').length,
  }
})

const syncStats = computed(() => {
  const jetstreams = jetstreamStore.jetstreams
  const consumers = consumerStore.consumers
  const totalSyncable = jetstreams.length + consumers.length
  const synced =
    jetstreams.filter((js) => js.sync_status === 'synced').length +
    consumers.filter((c) => c.sync_status === 'synced').length
  const failed =
    jetstreams.filter((js) => js.sync_status === 'failed').length +
    consumers.filter((c) => c.sync_status === 'failed').length
  return {
    total: totalSyncable,
    synced,
    failed,
  }
})

const healthStats = computed(() => {
  const clusters = clusterStore.clusters
  const jetstreams = jetstreamStore.jetstreams
  const consumers = consumerStore.consumers
  const total = clusters.length + jetstreams.length + consumers.length
  const healthy =
    clusters.filter((c) => c.status === 'active').length +
    jetstreams.filter((js) => js.status === 'active' && js.sync_status === 'synced').length +
    consumers.filter((c) => c.status === 'active' && c.sync_status === 'synced').length
  const unhealthy = total - healthy
  return {
    total,
    healthy,
    unhealthy,
  }
})

const recentJetStreams = computed(() => {
  return [...jetstreamStore.jetstreams]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
})

const recentConsumers = computed(() => {
  return [...consumerStore.consumers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
})

const formatTime = (time: string) => {
  return dayjs(time).format('MMM DD, HH:mm')
}

const getTaskIconClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'processing':
      return 'processing'
    default:
      return ''
  }
}

const getTaskTagType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    case 'pending':
      return 'info'
    default:
      return ''
  }
}

const loadTaskStats = async () => {
  try {
    const response = await jwtTaskApi.getTaskStats()
    taskStats.value = response
  } catch (error) {
    console.warn('Task stats API not available:', error)
    taskStats.value = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    }
  }
}

const loadRecentTasks = async () => {
  taskLoading.value = true
  try {
    const response = await jwtTaskApi.getRecentTasks(4)
    recentTasks.value = response
  } catch (error) {
    console.warn('Recent tasks API not available:', error)
    recentTasks.value = []
  } finally {
    taskLoading.value = false
  }
}

const retryTask = async (taskId: string) => {
  retryingTasks.value.push(taskId)
  try {
    await jwtTaskApi.retryTask(taskId)
    await loadRecentTasks()
    await loadTaskStats()
  } catch (error) {
    console.error('Failed to retry task:', error)
  } finally {
    retryingTasks.value = retryingTasks.value.filter((id) => id !== taskId)
  }
}

// Navigation functions
const goToJetStreamDetail = (id: string) => {
  router.push(`/jetstreams/${id}`)
}

const goToConsumerDetail = (id: string) => {
  router.push(`/consumers/${id}`)
}

const goToTaskDetail = (taskId: string) => {
  router.push(`/jwt-tasks/${taskId}`)
}

onMounted(() => {
  accountStore.fetchAccounts()
  userStore.fetchUsers()
  jetstreamStore.fetchJetStreams()
  consumerStore.fetchConsumers()
  clusterStore.fetchClusters()
  loadTaskStats()
  loadRecentTasks()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
  }

  p {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}

.stats-row {
  margin-bottom: 30px;
}

.stat-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  .stat-content.clickable-card {
    cursor: pointer;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .stat-content {
    display: flex;
    align-items: center;

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;

      img {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }

      &.cluster,
      &.account,
      &.user,
      &.jetstream,
      &.consumer,
      &.task,
      &.sync,
      &.health {
        background: rgba(64, 158, 255, 0.1);
      }
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 4px;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
      }

      .stat-detail {
        font-size: 12px;

        .active {
          color: var(--el-color-success);
          margin-right: 12px;
        }

        .disabled {
          color: var(--el-color-danger);
        }

        .completed {
          color: var(--el-color-success);
          margin-right: 12px;
        }

        .failed {
          color: var(--el-color-danger);
        }

        .healthy {
          color: var(--el-color-success);
          margin-right: 12px;
        }

        .unhealthy {
          color: var(--el-color-danger);
        }
      }
    }
  }
}

.content-row {
  margin-bottom: 30px;
}

.activity-card {
  height: 400px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .activity-list {
    height: 320px;
    overflow-y: auto;

    .activity-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      &.clickable {
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 6px;
        padding: 12px 8px;
        margin: 0 -8px;

        &:hover {
          background-color: var(--el-bg-color-page);
        }
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;

        img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        &.error {
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
        }

        &.success {
          background: var(--el-color-success-light-9);
          color: var(--el-color-success);
        }

        &.processing {
          background: var(--el-color-warning-light-9);
          color: var(--el-color-warning);
        }
      }

      .activity-info {
        flex: 1;
        min-width: 0;

        .activity-title {
          font-weight: 500;
          margin-bottom: 4px;
          color: var(--el-text-color-primary);
        }

        .activity-desc {
          font-size: 12px;
          color: var(--el-text-color-regular);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-time {
          font-size: 11px;
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }
}
</style>

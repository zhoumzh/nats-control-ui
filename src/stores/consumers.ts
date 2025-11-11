import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { consumerApi } from '@/api/consumers'
import type {
  Consumer,
  ConsumerForm,
  ConsumerStatus,
  ConsumerSyncStatus,
  ConsumerAckPolicy,
  ConsumerReplayPolicy,
  ConsumerDeliverPolicy,
  ConsumerType,
} from '@/types'

export const useConsumerStore = defineStore('consumers', () => {
  const consumers = ref<Consumer[]>([])
  const currentConsumer = ref<Consumer | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)

  const searchQuery = ref('')
  const statusFilter = ref<ConsumerStatus | ''>('')
  const syncStatusFilter = ref<ConsumerSyncStatus | ''>('')
  const jetstreamFilter = ref('')
  const clusterFilter = ref('')

  const filteredConsumers = computed(() => {
    let filtered = consumers.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
      )
    }

    if (statusFilter.value) {
      filtered = filtered.filter((c) => c.status === statusFilter.value)
    }

    if (syncStatusFilter.value) {
      filtered = filtered.filter((c) => c.sync_status === syncStatusFilter.value)
    }

    if (jetstreamFilter.value) {
      filtered = filtered.filter((c) => c.jetstream_id === jetstreamFilter.value)
    }

    if (clusterFilter.value) {
      filtered = filtered.filter((c) => c.cluster_id === clusterFilter.value)
    }

    return filtered
  })

  const fetchConsumers = async (params?: {
    jetstream_id?: string
    cluster_id?: string
    status?: string
    sync_status?: string
    search?: string
    page?: number
    page_size?: number
    sort_by?: string
    order?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await consumerApi.getConsumers(params)
      consumers.value = response.data
      total.value = response.total
      currentPage.value = response.page
      pageSize.value = response.page_size
      totalPages.value = response.total_pages
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch Consumers'
      console.error('Error fetching Consumers:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchConsumer = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const consumer = await consumerApi.getConsumer(id)
      currentConsumer.value = consumer
      return consumer
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch Consumer'
      console.error('Error fetching Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createConsumer = async (data: ConsumerForm) => {
    loading.value = true
    error.value = null

    try {
      const newConsumer = await consumerApi.createConsumer(data)
      consumers.value.unshift(newConsumer)
      total.value += 1
      return newConsumer
    } catch (err: any) {
      error.value = err.message || 'Failed to create Consumer'
      console.error('Error creating Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateConsumer = async (id: string, data: Partial<ConsumerForm>) => {
    loading.value = true
    error.value = null

    try {
      const updatedConsumer = await consumerApi.updateConsumer(id, data)
      const index = consumers.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        consumers.value[index] = updatedConsumer
      }
      if (currentConsumer.value?.id === id) {
        currentConsumer.value = updatedConsumer
      }
      return updatedConsumer
    } catch (err: any) {
      error.value = err.message || 'Failed to update Consumer'
      console.error('Error updating Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteConsumer = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await consumerApi.deleteConsumer(id)
      consumers.value = consumers.value.filter((c) => c.id !== id)
      total.value -= 1
      if (currentConsumer.value?.id === id) {
        currentConsumer.value = null
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete Consumer'
      console.error('Error deleting Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const retryConsumerSync = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedConsumer = await consumerApi.retryConsumerSync(id)

      const index = consumers.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        consumers.value[index] = updatedConsumer
      }

      if (currentConsumer.value?.id === id) {
        currentConsumer.value = updatedConsumer
      }

      return updatedConsumer
    } catch (err: any) {
      error.value = err.message || 'Failed to retry Consumer sync'
      console.error('Error retrying Consumer sync:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const pauseConsumer = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedConsumer = await consumerApi.pauseConsumer(id)

      const index = consumers.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        consumers.value[index] = updatedConsumer
      }

      if (currentConsumer.value?.id === id) {
        currentConsumer.value = updatedConsumer
      }

      return updatedConsumer
    } catch (err: any) {
      error.value = err.message || 'Failed to pause Consumer'
      console.error('Error pausing Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const resumeConsumer = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedConsumer = await consumerApi.resumeConsumer(id)

      const index = consumers.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        consumers.value[index] = updatedConsumer
      }

      if (currentConsumer.value?.id === id) {
        currentConsumer.value = updatedConsumer
      }

      return updatedConsumer
    } catch (err: any) {
      error.value = err.message || 'Failed to resume Consumer'
      console.error('Error resuming Consumer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentConsumer = () => {
    currentConsumer.value = null
  }

  const setFilters = (filters: {
    search?: string
    status?: ConsumerStatus | ''
    syncStatus?: ConsumerSyncStatus | ''
    jetstream?: string
    cluster?: string
  }) => {
    if (filters.search !== undefined) searchQuery.value = filters.search
    if (filters.status !== undefined) statusFilter.value = filters.status
    if (filters.syncStatus !== undefined) syncStatusFilter.value = filters.syncStatus
    if (filters.jetstream !== undefined) jetstreamFilter.value = filters.jetstream
    if (filters.cluster !== undefined) clusterFilter.value = filters.cluster
  }

  const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = ''
    syncStatusFilter.value = ''
    jetstreamFilter.value = ''
    clusterFilter.value = ''
  }

  const getAckPolicyOptions = () => [
    { label: '显式确认', value: 'explicit' as ConsumerAckPolicy },
    { label: '全部确认', value: 'all' as ConsumerAckPolicy },
    { label: '无需确认', value: 'none' as ConsumerAckPolicy },
  ]

  const getReplayPolicyOptions = () => [
    { label: '立即重放', value: 'instant' as ConsumerReplayPolicy },
    { label: '按原速重放', value: 'original' as ConsumerReplayPolicy },
  ]

  const getDeliverPolicyOptions = () => [
    { label: '所有消息', value: 'all' as ConsumerDeliverPolicy },
    { label: '最后一条', value: 'last' as ConsumerDeliverPolicy },
    { label: '新消息', value: 'new' as ConsumerDeliverPolicy },
    { label: '从指定序号', value: 'by_start_sequence' as ConsumerDeliverPolicy },
    { label: '从指定时间', value: 'by_start_time' as ConsumerDeliverPolicy },
    { label: '每个主题最后一条', value: 'last_per_subject' as ConsumerDeliverPolicy },
  ]

  const getConsumerTypeOptions = () => [
    { label: 'Pull (拉取模式)', value: 'pull' as ConsumerType },
    { label: 'Push (推送模式)', value: 'push' as ConsumerType },
  ]

  return {
    consumers,
    currentConsumer,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    totalPages,
    searchQuery,
    statusFilter,
    syncStatusFilter,
    jetstreamFilter,
    clusterFilter,

    filteredConsumers,

    fetchConsumers,
    fetchConsumer,
    createConsumer,
    updateConsumer,
    deleteConsumer,
    retryConsumerSync,
    pauseConsumer,
    resumeConsumer,
    clearError,
    clearCurrentConsumer,
    setFilters,
    resetFilters,

    getAckPolicyOptions,
    getReplayPolicyOptions,
    getDeliverPolicyOptions,
    getConsumerTypeOptions,
  }
})

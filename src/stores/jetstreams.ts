import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jetStreamApi } from '@/api/jetstreams'
import type { JetStream, JetStreamForm, JetStreamStatus, PaginationParams } from '@/types'
import {
  JetStreamStorageType,
  JetStreamRetentionPolicy,
  JetStreamDiscardPolicy,
  JetStreamCompressionType,
} from '@/types'

export const useJetStreamStore = defineStore('jetstreams', () => {
  // State
  const jetstreams = ref<JetStream[]>([])
  const currentJetStream = ref<JetStream | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)

  // Filters
  const searchQuery = ref('')
  const statusFilter = ref<JetStreamStatus | ''>('')
  const syncStatusFilter = ref<string>('') // 新增同步状态筛选
  const natsOperateUserFilter = ref('') // 更新为 nats_operate_user_id
  const clusterFilter = ref('')

  // Computed
  const filteredJetStreams = computed(() => {
    let filtered = jetstreams.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (js) =>
          js.name.toLowerCase().includes(query) || js.description.toLowerCase().includes(query)
      )
    }

    if (statusFilter.value) {
      filtered = filtered.filter((js) => js.status === statusFilter.value)
    }

    if (natsOperateUserFilter.value) {
      filtered = filtered.filter((js) => js.nats_operate_user_id === natsOperateUserFilter.value)
    }

    if (clusterFilter.value) {
      filtered = filtered.filter((js) => js.cluster_id === clusterFilter.value)
    }

    return filtered
  })

  // Actions
  const fetchJetStreams = async (params?: {
    creator_user_id?: string
    status?: string
    sync_status?: string
    cluster_id?: string
    search?: string
    page?: number
    page_size?: number
    sort_by?: string
    order?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await jetStreamApi.getJetStreams(params)
      jetstreams.value = response.data
      total.value = response.total
      currentPage.value = response.page
      pageSize.value = response.page_size
      totalPages.value = response.total_pages
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch JetStreams'
      console.error('Error fetching JetStreams:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchJetStream = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const jetstream = await jetStreamApi.getJetStream(id)
      currentJetStream.value = jetstream
      return jetstream
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch JetStream'
      console.error('Error fetching JetStream:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createJetStream = async (data: JetStreamForm) => {
    loading.value = true
    error.value = null

    try {
      const newJetStream = await jetStreamApi.createJetStream(data)
      jetstreams.value.unshift(newJetStream)
      total.value += 1
      return newJetStream
    } catch (err: any) {
      error.value = err.message || 'Failed to create JetStream'
      console.error('Error creating JetStream:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateJetStream = async (id: string, data: Partial<JetStreamForm>) => {
    loading.value = true
    error.value = null

    try {
      const updatedJetStream = await jetStreamApi.updateJetStream(id, data)
      const index = jetstreams.value.findIndex((js) => js.id === id)
      if (index !== -1) {
        jetstreams.value[index] = updatedJetStream
      }
      if (currentJetStream.value?.id === id) {
        currentJetStream.value = updatedJetStream
      }
      return updatedJetStream
    } catch (err: any) {
      error.value = err.message || 'Failed to update JetStream'
      console.error('Error updating JetStream:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteJetStream = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await jetStreamApi.deleteJetStream(id)
      jetstreams.value = jetstreams.value.filter((js) => js.id !== id)
      total.value -= 1
      if (currentJetStream.value?.id === id) {
        currentJetStream.value = null
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete JetStream'
      console.error('Error deleting JetStream:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const batchDeleteJetStreams = async (ids: string[]) => {
    loading.value = true
    error.value = null

    try {
      const result = await jetStreamApi.batchDeleteJetStreams(ids)
      // Remove successfully deleted jetstreams
      jetstreams.value = jetstreams.value.filter((js) => !ids.includes(js.id))
      total.value -= result.deleted_count
      return result
    } catch (err: any) {
      error.value = err.message || 'Failed to batch delete JetStreams'
      console.error('Error batch deleting JetStreams:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncJetStreamStatus = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedJetStream = await jetStreamApi.syncJetStreamStatus(id)

      // Update the jetstream in the list with the sync status
      const index = jetstreams.value.findIndex((js) => js.id === id)
      if (index !== -1) {
        jetstreams.value[index] = updatedJetStream
      }

      // Update current jetstream if viewing the same one
      if (currentJetStream.value?.id === id) {
        currentJetStream.value = updatedJetStream
      }

      return updatedJetStream
    } catch (err: any) {
      error.value = err.message || 'Failed to sync JetStream status'
      console.error('Error syncing JetStream status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const retryJetStreamCreation = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const updatedJetStream = await jetStreamApi.retryJetStreamCreation(id)

      // Update the jetstream in the list
      const index = jetstreams.value.findIndex((js) => js.id === id)
      if (index !== -1) {
        jetstreams.value[index] = updatedJetStream
      }

      if (currentJetStream.value?.id === id) {
        currentJetStream.value = updatedJetStream
      }

      return updatedJetStream
    } catch (err: any) {
      error.value = err.message || 'Failed to retry JetStream creation'
      console.error('Error retrying JetStream creation:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const validateJetStreamName = async (name: string, creatorUserId: string, excludeId?: string) => {
    try {
      const response = await jetStreamApi.validateJetStreamName({
        name,
        creator_user_id: creatorUserId,
        exclude_id: excludeId,
      })
      return response
    } catch (err: any) {
      console.error('Error validating JetStream name:', err)
      throw err
    }
  }

  const fetchJetStreamsByUser = async (userId: string, params?: PaginationParams) => {
    loading.value = true
    error.value = null

    try {
      const response = await jetStreamApi.getJetStreamsByUser(userId, params)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user JetStreams'
      console.error('Error fetching user JetStreams:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  const clearError = () => {
    error.value = null
  }

  const clearCurrentJetStream = () => {
    currentJetStream.value = null
  }

  const setFilters = (filters: {
    search?: string
    status?: JetStreamStatus | ''
    syncStatus?: string
    natsOperateUser?: string
    cluster?: string
  }) => {
    if (filters.search !== undefined) searchQuery.value = filters.search
    if (filters.status !== undefined) statusFilter.value = filters.status
    if (filters.syncStatus !== undefined) syncStatusFilter.value = filters.syncStatus
    if (filters.natsOperateUser !== undefined) natsOperateUserFilter.value = filters.natsOperateUser
    if (filters.cluster !== undefined) clusterFilter.value = filters.cluster
  }

  const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = ''
    syncStatusFilter.value = ''
    natsOperateUserFilter.value = ''
    clusterFilter.value = ''
  }

  // Helper functions for form options
  const getStorageTypeOptions = () => [
    { label: '文件存储', value: JetStreamStorageType.FILE },
    { label: '内存存储', value: JetStreamStorageType.MEMORY },
  ]

  const getRetentionPolicyOptions = () => [
    { label: '基于限制', value: JetStreamRetentionPolicy.LIMITS },
    { label: '基于兴趣', value: JetStreamRetentionPolicy.INTEREST },
    { label: '工作队列', value: JetStreamRetentionPolicy.WORKQUEUE },
  ]

  const getDiscardPolicyOptions = () => [
    { label: '丢弃旧消息', value: JetStreamDiscardPolicy.OLD },
    { label: '丢弃新消息', value: JetStreamDiscardPolicy.NEW },
  ]

  const getCompressionTypeOptions = () => [
    { label: '无压缩', value: JetStreamCompressionType.NONE },
    { label: 'S2压缩', value: JetStreamCompressionType.S2 },
  ]

  return {
    // State
    jetstreams,
    currentJetStream,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    totalPages,
    searchQuery,
    statusFilter,
    syncStatusFilter,
    natsOperateUserFilter,
    clusterFilter,

    // Computed
    filteredJetStreams,

    // Actions
    fetchJetStreams,
    fetchJetStream,
    createJetStream,
    updateJetStream,
    deleteJetStream,
    batchDeleteJetStreams,
    syncJetStreamStatus,
    retryJetStreamCreation,
    validateJetStreamName,
    fetchJetStreamsByUser,
    clearError,
    clearCurrentJetStream,
    setFilters,
    resetFilters,

    // Helper functions
    getStorageTypeOptions,
    getRetentionPolicyOptions,
    getDiscardPolicyOptions,
    getCompressionTypeOptions,
  }
})

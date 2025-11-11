import apiClient from './client'
import type { Consumer, ConsumerForm, ConsumerStatsResponse } from '@/types'

export const consumerApi = {
  getConsumers(params?: {
    jetstream_id?: string
    cluster_id?: string
    status?: string
    sync_status?: string
    search?: string
    page?: number
    page_size?: number
    sort_by?: string
    order?: string
  }): Promise<{
    data: Consumer[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> {
    return apiClient.get('/consumers', { params }).then((res) => res.data)
  },

  getConsumer(id: string): Promise<Consumer> {
    return apiClient.get(`/consumers/${id}`).then((res) => res.data)
  },

  createConsumer(data: ConsumerForm): Promise<Consumer> {
    console.log('=== API REQUEST ===')
    console.log('Sending data to /consumers:', JSON.stringify(data, null, 2))
    return apiClient.post('/consumers', data).then((res) => {
      console.log('=== API RESPONSE ===')
      console.log('Response from /consumers:', JSON.stringify(res.data, null, 2))
      return res.data
    })
  },

  updateConsumer(id: string, data: Partial<ConsumerForm>): Promise<Consumer> {
    return apiClient.put(`/consumers/${id}`, data).then((res) => res.data)
  },

  deleteConsumer(id: string): Promise<void> {
    return apiClient.delete(`/consumers/${id}`).then((res) => res.data)
  },

  retryConsumerSync(id: string): Promise<Consumer> {
    return apiClient.post(`/consumers/${id}/retry`).then((res) => res.data)
  },

  pauseConsumer(id: string): Promise<Consumer> {
    return apiClient.post(`/consumers/${id}/pause`).then((res) => res.data)
  },

  resumeConsumer(id: string): Promise<Consumer> {
    return apiClient.post(`/consumers/${id}/resume`).then((res) => res.data)
  },

  getConsumerStats(): Promise<ConsumerStatsResponse> {
    return apiClient.get('/consumers/stats').then((res) => res.data)
  },

  getConsumerDiff(id: string): Promise<{
    has_difference: boolean
    database_config: any
    cluster_config: any
    differences: Array<{
      field: string
      database_value: any
      cluster_value: any
    }>
  }> {
    return apiClient.get(`/consumers/${id}/diff`).then((res) => res.data)
  },
}

export const {
  getConsumers,
  getConsumer,
  createConsumer,
  updateConsumer,
  deleteConsumer,
  retryConsumerSync,
  pauseConsumer,
  resumeConsumer,
  getConsumerStats,
  getConsumerDiff,
} = consumerApi

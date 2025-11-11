import apiClient from './client'
import type { JetStream, JetStreamForm, PaginationParams } from '@/types'

export const jetStreamApi = {
  // List JetStreams with optional filters
  getJetStreams(params?: {
    creator_user_id?: string
    status?: string
    sync_status?: string
    cluster_id?: string
    search?: string
    page?: number
    page_size?: number
    sort_by?: string
    order?: string
  }): Promise<{
    data: JetStream[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> {
    return apiClient.get('/jetstreams', { params }).then((res) => res.data)
  },

  // Get JetStream by ID
  getJetStream(id: string): Promise<JetStream> {
    return apiClient.get(`/jetstreams/${id}`).then((res) => res.data)
  },

  // Create JetStream
  createJetStream(data: JetStreamForm): Promise<JetStream> {
    return apiClient.post('/jetstreams', data).then((res) => res.data)
  },

  // Update JetStream
  updateJetStream(id: string, data: Partial<JetStreamForm>): Promise<JetStream> {
    return apiClient.put(`/jetstreams/${id}`, data).then((res) => res.data)
  },

  // Delete JetStream
  deleteJetStream(id: string): Promise<void> {
    return apiClient.delete(`/jetstreams/${id}`).then((res) => res.data)
  },

  // Batch delete JetStreams
  batchDeleteJetStreams(ids: string[]): Promise<{
    deleted_count: number
    failed_count: number
    errors: string[]
  }> {
    return apiClient.post('/jetstreams/batch-delete', { ids }).then((res) => res.data)
  },

  // Validate JetStream name
  validateJetStreamName(params: {
    name: string
    creator_user_id: string
    exclude_id?: string
  }): Promise<{
    valid: boolean
    message: string
  }> {
    return apiClient.get('/jetstreams/validate-name', { params }).then((res) => res.data)
  },

  // Sync JetStream status
  syncJetStreamStatus(id: string): Promise<JetStream> {
    return apiClient.post(`/jetstreams/${id}/sync`).then((res) => res.data)
  },

  // Retry JetStream creation
  retryJetStreamCreation(id: string): Promise<JetStream> {
    return apiClient.post(`/jetstreams/${id}/retry`).then((res) => res.data)
  },

  // Get JetStreams by user
  getJetStreamsByUser(userId: string, params?: PaginationParams): Promise<JetStream[]> {
    return apiClient.get(`/users/${userId}/jetstreams`, { params }).then((res) => res.data)
  },

  // Get JetStream diff
  getJetStreamDiff(id: string): Promise<{
    has_difference: boolean
    database_config: any
    cluster_config: any
    differences: Array<{
      field: string
      database_value: any
      cluster_value: any
    }>
  }> {
    return apiClient.get(`/jetstreams/${id}/diff`).then((res) => res.data)
  },
}

// Export individual functions for convenient importing
export const {
  getJetStreams,
  getJetStream,
  createJetStream,
  updateJetStream,
  deleteJetStream,
  batchDeleteJetStreams,
  validateJetStreamName,
  syncJetStreamStatus,
  retryJetStreamCreation,
  getJetStreamsByUser,
  getJetStreamDiff,
} = jetStreamApi

import apiClient from './client'
import type { JWTTask, PaginationParams } from '@/types'

export const jwtTaskApi = {
  // Get all JWT tasks
  getTasks(params?: PaginationParams): Promise<JWTTask[]> {
    return apiClient.get('/jwt-tasks', { params }).then((res) => res.data)
  },

  // Get JWT task by ID
  getTask(id: string): Promise<JWTTask> {
    return apiClient.get(`/jwt-tasks/${id}`).then((res) => res.data)
  },

  // Retry JWT task
  retryTask(id: string): Promise<{ task_id: string; message: string }> {
    return apiClient.post(`/jwt-tasks/${id}/retry`).then((res) => res.data)
  },

  // Get task statistics
  getTaskStats(): Promise<{
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    retrying?: number
  }> {
    return apiClient.get('/jwt-tasks/stats').then((res) => res.data)
  },

  // Get recent tasks (limit to specified number)
  getRecentTasks(limit: number = 10): Promise<JWTTask[]> {
    return apiClient
      .get('/jwt-tasks', {
        params: { page: 1, page_size: limit },
      })
      .then((res) => {
        const tasks = res.data as JWTTask[]
        // Sort by updated_at descending to get most recent first
        return tasks
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, limit)
      })
  },
}

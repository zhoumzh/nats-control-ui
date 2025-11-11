import apiClient from './client'
import type { User, UserForm, PaginationParams } from '@/types'

export const userApi = {
  // Get all users with optional filters (including account_id)
  getUsers(params?: PaginationParams & { account_id?: string }): Promise<User[]> {
    return apiClient.get('/users', { params }).then((res) => res.data)
  },

  // Get admin users from non-system accounts
  getAdminUsersFromNonSystemAccounts(): Promise<User[]> {
    return apiClient.get('/users/admin/non-system').then((res) => res.data)
  },

  // Get user by ID
  getUser(id: string): Promise<User> {
    return apiClient.get(`/users/${id}`).then((res) => res.data)
  },

  // Create user
  createUser(data: UserForm): Promise<User> {
    return apiClient.post(`/accounts/${data.account_id}/users`, data).then((res) => res.data)
  },

  // Update user
  updateUser(id: string, data: UserForm): Promise<User> {
    return apiClient.put(`/users/${id}`, data).then((res) => res.data)
  },

  // Delete user
  deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`).then((res) => res.data)
  },

  // Enable user
  enableUser(id: string): Promise<void> {
    return apiClient.post(`/users/${id}/enable`).then((res) => res.data)
  },

  // Disable user
  disableUser(id: string): Promise<void> {
    return apiClient.post(`/users/${id}/disable`).then((res) => res.data)
  },

  // Generate user keys
  generateUserKeys(): Promise<{ public_key: string; nkey: string }> {
    return apiClient.post('/users/generate-keys').then((res) => res.data)
  },

  // Get user JWT
  getUserJWT(id: string): Promise<{ raw_token: string; claims: any }> {
    return apiClient.get(`/users/${id}/jwt`).then((res) => res.data)
  },

  // Get user creds file content
  getUserCreds(id: string): Promise<{ creds_content: string }> {
    return apiClient.get(`/users/${id}/creds`).then((res) => res.data)
  },

  // Download user creds file
  downloadCreds(id: string): Promise<Blob> {
    return apiClient
      .get(`/users/${id}/creds/download`, {
        responseType: 'blob',
      })
      .then((res) => res.data)
  },

  // Copy user context
  copyUserContext(id: string): Promise<string> {
    return apiClient.get(`/users/${id}/copy-context`).then((res) => res.data)
  },
}

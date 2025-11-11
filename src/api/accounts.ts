import apiClient from './client'
import type { Account, AccountForm, ApiResponse, ListResponse, PaginationParams } from '@/types'

export const accountApi = {
  // Get all accounts with filters
  getAccounts(
    params?: PaginationParams & {
      search?: string
      status?: string
      account_type?: string
      cluster_id?: string
      sort_by?: string
      order?: 'asc' | 'desc'
    }
  ): Promise<Account[]> {
    return apiClient.get('/accounts', { params }).then((res) => res.data)
  },

  // Get account by ID
  getAccount(id: string): Promise<Account> {
    return apiClient.get(`/accounts/${id}`).then((res) => res.data)
  },

  // Create account
  createAccount(data: AccountForm): Promise<Account> {
    return apiClient.post('/accounts', data).then((res) => res.data)
  },

  // Update account
  updateAccount(id: string, data: AccountForm): Promise<Account> {
    return apiClient.put(`/accounts/${id}`, data).then((res) => res.data)
  },

  // Delete account
  deleteAccount(id: string): Promise<void> {
    return apiClient.delete(`/accounts/${id}`).then((res) => res.data)
  },

  // Enable account
  enableAccount(id: string): Promise<void> {
    return apiClient.post(`/accounts/${id}/enable`).then((res) => res.data)
  },

  // Disable account
  disableAccount(id: string): Promise<void> {
    return apiClient.post(`/accounts/${id}/disable`).then((res) => res.data)
  },

  // Generate account keys
  generateAccountKeys(): Promise<{ public_key: string; nkey: string }> {
    return apiClient.post('/accounts/generate-keys').then((res) => res.data)
  },

  // Get account JWT
  getAccountJWT(id: string): Promise<{ raw_token: string; claims: any }> {
    return apiClient.get(`/accounts/${id}/jwt`).then((res) => res.data)
  },

  // Add account export
  addAccountExport(
    id: string,
    data: {
      name: string
      subject: string
      type: 'stream' | 'service'
      token_req?: boolean
      response_type?: string
      account_token_position?: number
      description?: string
      info_url?: string
    }
  ): Promise<Account> {
    return apiClient.post(`/accounts/${id}/exports`, data).then((res) => res.data)
  },

  // Remove account export
  removeAccountExport(id: string, name: string): Promise<Account> {
    return apiClient.delete(`/accounts/${id}/exports/${name}`).then((res) => res.data)
  },

  // Add account import
  addAccountImport(
    id: string,
    data: {
      name: string
      subject: string
      account: string
      token?: string
      to?: string
      type: 'stream' | 'service'
    }
  ): Promise<Account> {
    return apiClient.post(`/accounts/${id}/imports`, data).then((res) => res.data)
  },

  // Remove account import
  removeAccountImport(id: string, name: string): Promise<Account> {
    return apiClient.delete(`/accounts/${id}/imports/${name}`).then((res) => res.data)
  },

  // Create account association (simplified)
  createAccountAssociation(
    id: string,
    data: {
      target_account_id: string
      subjects: Array<{
        subject: string
        type: 'stream' | 'service'
        description?: string
      }>
      description?: string
    }
  ): Promise<{ message: string }> {
    return apiClient.post(`/accounts/${id}/associate`, data).then((res) => res.data)
  },

  // Manual sync JWT to selected clusters
  syncAccountJWT(
    id: string,
    data: {
      cluster_ids: string[]
    }
  ): Promise<{ message: string; account_id: string; cluster_count: number }> {
    return apiClient.post(`/accounts/${id}/sync`, data).then((res) => res.data)
  },

  // Get account user count
  getAccountUserCount(id: string): Promise<number> {
    return apiClient.get(`/accounts/${id}/user-count`).then((res) => res.data)
  },

  // Get JWT task count by public key
  getJWTTaskCountByPublicKey(publicKey: string): Promise<number> {
    return apiClient.get(`/accounts/public-key/${publicKey}/jwt-task-count`).then((res) => res.data)
  },
}

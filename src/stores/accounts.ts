import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi } from '@/api/accounts'
import type { Account, AccountForm, PaginationParams } from '@/types'
import { AccountStatus } from '@/types'
import { ElMessage } from 'element-plus'

export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const currentAccount = ref<Account | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const fetchAccounts = async (
    params?: PaginationParams & {
      search?: string
      status?: string
      account_type?: string
      cluster_id?: string
      sort_by?: string
      order?: 'asc' | 'desc'
    }
  ) => {
    loading.value = true
    try {
      const response = await accountApi.getAccounts({
        page: currentPage.value,
        page_size: pageSize.value,
        ...params,
      })
      accounts.value = response
      total.value = response.length
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAccount = async (id: string) => {
    loading.value = true
    try {
      const response = await accountApi.getAccount(id)
      currentAccount.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createAccount = async (accountData: AccountForm) => {
    loading.value = true
    try {
      const response = await accountApi.createAccount(accountData)
      accounts.value.unshift(response)
      total.value += 1
      ElMessage.success('Account created successfully')
      return response
    } catch (error) {
      console.error('Failed to create account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateAccount = async (id: string, accountData: AccountForm) => {
    loading.value = true
    try {
      const response = await accountApi.updateAccount(id, accountData)
      const index = accounts.value.findIndex((account) => account.id === id)
      if (index !== -1) {
        accounts.value[index] = response
      }
      if (currentAccount.value?.id === id) {
        currentAccount.value = response
      }
      ElMessage.success('Account updated successfully')
      return response
    } catch (error) {
      console.error('Failed to update account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteAccount = async (id: string) => {
    loading.value = true
    try {
      await accountApi.deleteAccount(id)
      accounts.value = accounts.value.filter((account) => account.id !== id)
      total.value -= 1
      ElMessage.success('Account deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      // 不在这里显示错误消息，让组件自己处理
      // 直接抛出错误，保留错误信息
      throw error
    } finally {
      loading.value = false
    }
  }

  const enableAccount = async (id: string) => {
    try {
      await accountApi.enableAccount(id)
      const account = accounts.value.find((a) => a.id === id)
      if (account) {
        account.status = AccountStatus.ACTIVE
      }
      ElMessage.success('Account enabled successfully')
    } catch (error) {
      console.error('Failed to enable account:', error)
      throw error
    }
  }

  const disableAccount = async (id: string) => {
    try {
      await accountApi.disableAccount(id)
      const account = accounts.value.find((a) => a.id === id)
      if (account) {
        account.status = AccountStatus.DISABLED
      }
      ElMessage.success('Account disabled successfully')
    } catch (error) {
      console.error('Failed to disable account:', error)
      throw error
    }
  }

  const generateKeys = async () => {
    try {
      const response = await accountApi.generateAccountKeys()
      return response
    } catch (error) {
      console.error('Failed to generate keys:', error)
      throw error
    }
  }

  return {
    accounts,
    currentAccount,
    loading,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchAccounts,
    fetchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    enableAccount,
    disableAccount,
    generateKeys,
  }
})

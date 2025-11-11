import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/users'
import type { User, UserForm, PaginationParams } from '@/types'
import { UserStatus } from '@/types'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const adminUsers = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const fetchUsers = async (params?: PaginationParams & { account_id?: string }) => {
    loading.value = true
    try {
      const response = await userApi.getUsers({
        page: currentPage.value,
        page_size: pageSize.value,
        ...params,
      })
      users.value = response
      total.value = response.length
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchUsersByAccount = async (accountId: string, params?: PaginationParams) => {
    loading.value = true
    try {
      const response = await userApi.getUsers({
        page: currentPage.value,
        page_size: pageSize.value,
        account_id: accountId,
        ...params,
      })
      users.value = response
      total.value = response.length
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchAdminUsersFromNonSystemAccounts = async () => {
    loading.value = true
    try {
      const response = await userApi.getAdminUsersFromNonSystemAccounts()
      adminUsers.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch admin users:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async (id: string) => {
    loading.value = true
    try {
      const response = await userApi.getUser(id)
      currentUser.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch user:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: UserForm) => {
    loading.value = true
    try {
      const response = await userApi.createUser(userData)
      users.value.unshift(response)
      total.value += 1
      ElMessage.success('User created successfully')
      return response
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string, userData: UserForm) => {
    loading.value = true
    try {
      const response = await userApi.updateUser(id, userData)
      const index = users.value.findIndex((user) => user.id === id)
      if (index !== -1) {
        users.value[index] = response
      }
      if (currentUser.value?.id === id) {
        currentUser.value = response
      }
      ElMessage.success('User updated successfully')
      return response
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: string) => {
    loading.value = true
    try {
      await userApi.deleteUser(id)
      users.value = users.value.filter((user) => user.id !== id)
      total.value -= 1
      ElMessage.success('User deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      // 不在这里显示错误消息，让组件自己处理
      // 直接抛出错误，保留错误信息
      throw error
    } finally {
      loading.value = false
    }
  }

  const enableUser = async (id: string) => {
    try {
      await userApi.enableUser(id)
      const user = users.value.find((u) => u.id === id)
      if (user) {
        user.status = UserStatus.ACTIVE
      }
      ElMessage.success('User enabled successfully')
    } catch (error) {
      console.error('Failed to enable user:', error)
      throw error
    }
  }

  const disableUser = async (id: string) => {
    try {
      await userApi.disableUser(id)
      const user = users.value.find((u) => u.id === id)
      if (user) {
        user.status = UserStatus.DISABLED
      }
      ElMessage.success('User disabled successfully')
    } catch (error) {
      console.error('Failed to disable user:', error)
      throw error
    }
  }

  const generateKeys = async () => {
    try {
      const response = await userApi.generateUserKeys()
      return response
    } catch (error) {
      console.error('Failed to generate keys:', error)
      throw error
    }
  }

  return {
    users,
    adminUsers,
    currentUser,
    loading,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchUsers,
    fetchUsersByAccount,
    fetchAdminUsersFromNonSystemAccounts,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    enableUser,
    disableUser,
    generateKeys,
  }
})

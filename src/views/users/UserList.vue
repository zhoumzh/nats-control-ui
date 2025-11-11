<template>
  <div class="user-list">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDescription }}</p>
        </div>
        <el-button type="primary" @click="createUser">
          <el-icon><Plus /></el-icon>
          创建用户
        </el-button>
      </div>
    </div>

    <!-- Account Selector (only when viewing all users) -->
    <el-card v-if="!currentAccountId" class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select
            v-model="selectedAccountId"
            placeholder="按账户筛选"
            clearable
            filterable
            @change="handleAccountFilter"
          >
            <el-option
              v-for="account in accountStore.accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchQuery" placeholder="搜索用户..." clearable @input="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="状态" clearable @change="handleFilter">
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
            <el-option label="名称" value="name" />
            <el-option label="创建日期" value="created_at" />
            <el-option label="更新日期" value="updated_at" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="sortOrder" placeholder="顺序" @change="handleFilter">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="refreshData" :loading="userStore.loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table -->
    <el-card shadow="never">
      <el-table
        :data="userStore.users"
        v-loading="userStore.loading"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="名称" sortable width="200">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">
                <span class="user-name-clickable" @click="goToUserDetail(row)">{{ row.name }}</span>
              </div>
              <div class="user-id">{{ row.id }}</div>
              <div v-if="row.description" class="user-description">
                {{ formatDescription(row.description) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column v-if="!currentAccountId" prop="account_id" label="账户" width="180">
          <template #default="{ row }">
            <div class="account-info">
              <div class="account-name">{{ getAccountName(row.account_id) }}</div>
              <div class="account-id">{{ row.account_id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="public_key" label="公钥" width="200">
          <template #default="{ row }">
            <div class="key-field">
              <code class="key-text">{{ formatKey(row.public_key) }}</code>
              <el-button text size="small" @click="copyToClipboard(row.public_key)">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="is_admin" label="类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_admin" type="warning" size="small"> 管理员 </el-tag>
            <el-tag v-else type="info" size="small" plain> 普通 </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="权限配置" width="160">
          <template #default="{ row }">
            <div class="permissions-summary">
              <div class="permission-row">
                <el-tag
                  v-if="hasPublishPermissions(row)"
                  type="success"
                  size="small"
                  class="permission-tag"
                >
                  发布: {{ getPermissionCount(row, 'publish') }}
                </el-tag>
                <el-tag
                  v-if="hasSubscribePermissions(row)"
                  type="primary"
                  size="small"
                  class="permission-tag"
                >
                  订阅: {{ getPermissionCount(row, 'subscribe') }}
                </el-tag>
              </div>
              <div v-if="hasJetStreamPermissions(row)" class="permission-row">
                <el-tag type="warning" size="small" class="permission-tag"> JetStream </el-tag>
              </div>
              <div v-if="!hasAnyPermissions(row)" class="no-permissions">
                <el-tag type="info" size="small" plain>无权限</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="限制配置" width="120">
          <template #default="{ row }">
            <div v-if="row.limits" class="limits-summary">
              <div class="limit-item">
                <span class="limit-label">数据:</span>
                <span class="limit-value">{{ formatBytes(row.limits.max_data) }}</span>
              </div>
              <div class="limit-item">
                <span class="limit-label">载荷:</span>
                <span class="limit-value">{{ formatBytes(row.limits.max_payload) }}</span>
              </div>
              <div v-if="row.limits.max_subscriptions" class="limit-item">
                <span class="limit-label">订阅:</span>
                <span class="limit-value">{{ row.limits.max_subscriptions }}</span>
              </div>
            </div>
            <div v-else class="no-limits">
              <el-tag type="info" size="small" plain>无限制</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" sortable>
          <template #default="{ row }">
            <div class="time-info">
              <div class="time-value">{{ formatDate(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="160" sortable>
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.updated_at && row.updated_at !== row.created_at" class="time-value">
                {{ formatDate(row.updated_at) }}
              </div>
              <div v-else class="time-value">-</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button text type="primary" size="small" @click="goToUserDetail(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
              <el-dropdown
                trigger="click"
                @command="(command: string) => handleIdentityCommand(command, row)"
              >
                <el-button text type="primary" size="small" :loading="downloadingUsers.has(row.id)">
                  身份
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="download">
                      <el-icon><Download /></el-icon>
                      下载凭证
                    </el-dropdown-item>
                    <el-dropdown-item command="context">
                      <el-icon><DocumentCopy /></el-icon>
                      复制Context
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button text type="danger" size="small" @click="deleteUser(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="userStore.currentPage"
          v-model:page-size="userStore.pageSize"
          :total="userStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/users'
import { useAccountStore } from '@/stores/accounts'
import { userApi } from '@/api/users'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  Plus,
  Search,
  RefreshLeft,
  Refresh,
  DocumentCopy,
  Download,
  View,
  Delete,
  ArrowDown,
} from '@element-plus/icons-vue'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()

const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')
const selectedAccountId = ref('')

// Download state
const downloadingUsers = ref(new Set<string>())

const currentAccountId = computed(() => route.params.accountId as string)

const pageTitle = computed(() => {
  if (currentAccountId.value) {
    const account = accountStore.accounts.find((a) => a.id === currentAccountId.value)
    return `用户 - ${account?.name || '账户'}`
  }
  return '用户管理'
})

const pageDescription = computed(() => {
  if (currentAccountId.value) {
    return '管理此账户的用户'
  }
  return '管理NATS用户及其权限'
})

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatKey = (key: string) => {
  if (key.length <= 20) return key
  return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`
}

const formatDescription = (description: string) => {
  if (!description) return ''
  if (description.length <= 30) return description
  return `${description.substring(0, 30)}...`
}

const formatBytes = (bytes: number) => {
  if (bytes === -1) return '无限制'
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getAccountName = (accountId: string) => {
  const account = accountStore.accounts.find((a) => a.id === accountId)
  return account?.name || '未知账户'
}

const hasPublishPermissions = (user: User) => {
  return user.permissions?.publish?.allow && user.permissions.publish.allow.length > 0
}

const hasSubscribePermissions = (user: User) => {
  return user.permissions?.subscribe?.allow && user.permissions.subscribe.allow.length > 0
}

const hasJetStreamPermissions = (user: User) => {
  return (
    user.permissions?.jetstream?.publish?.allow || user.permissions?.jetstream?.subscribe?.allow
  )
}

const hasAnyPermissions = (user: User) => {
  return (
    hasPublishPermissions(user) || hasSubscribePermissions(user) || hasJetStreamPermissions(user)
  )
}

const getPermissionCount = (user: User, type: 'publish' | 'subscribe') => {
  const allowCount = user.permissions?.[type]?.allow?.length || 0
  const denyCount = user.permissions?.[type]?.deny?.length || 0
  return allowCount + denyCount
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleSearch = () => {
  handleFilter()
}

const handleAccountFilter = () => {
  handleFilter()
}

const handleFilter = () => {
  const params = {
    search: searchQuery.value,
    status: statusFilter.value,
    sort_by: sortBy.value,
    order: sortOrder.value as 'asc' | 'desc',
  }

  if (currentAccountId.value) {
    userStore.fetchUsersByAccount(currentAccountId.value, params)
  } else if (selectedAccountId.value) {
    userStore.fetchUsersByAccount(selectedAccountId.value, params)
  } else {
    userStore.fetchUsers(params)
  }
}

const handleSortChange = ({ prop, order }: any) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  handleFilter()
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  selectedAccountId.value = ''
  handleFilter()
}

const refreshData = () => {
  handleFilter()
}

const handlePageChange = (page: number) => {
  userStore.currentPage = page
  handleFilter()
}

const handleSizeChange = (size: number) => {
  userStore.pageSize = size
  handleFilter()
}

const createUser = () => {
  if (currentAccountId.value) {
    router.push(`/users/create?accountId=${currentAccountId.value}`)
  } else {
    router.push('/users/create')
  }
}

const goToUserDetail = (user: User) => {
  router.push(`/users/${user.id}`)
}

const downloadCreds = async (user: User) => {
  downloadingUsers.value.add(user.id)
  try {
    const blob = await userApi.downloadCreds(user.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${user.name}.creds`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('Creds文件下载成功')
  } catch (error) {
    console.error('Failed to download creds:', error)
    ElMessage.error('下载Creds文件失败')
  } finally {
    downloadingUsers.value.delete(user.id)
  }
}

// 复制用户 Context
const copyUserContext = async (user: User) => {
  downloadingUsers.value.add(user.id)
  try {
    const contextData = await userApi.copyUserContext(user.id)
    await navigator.clipboard.writeText(contextData)
    ElMessage.success('Context已复制到剪贴板')
  } catch (error) {
    console.error('Failed to copy user context:', error)
    ElMessage.error('复制Context失败')
  } finally {
    downloadingUsers.value.delete(user.id)
  }
}

// 处理身份下拉菜单命令
const handleIdentityCommand = (command: string, user: User) => {
  if (command === 'download') {
    downloadCreds(user)
  } else if (command === 'context') {
    copyUserContext(user)
  }
}

// 删除用户
const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.name}" 吗？此操作不可撤销。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error',
    })

    await userStore.deleteUser(user.id)
    ElMessage.success('用户已删除')
    // 刷新列表
    refreshData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      // 显示后端返回的具体错误信息
      const errorMessage =
        error.userMessage ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        '删除用户失败'
      ElMessage.error(errorMessage)
    }
  }
}

onMounted(async () => {
  // Load accounts first if not already loaded
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts()
  }

  // Load users after accounts are loaded
  if (currentAccountId.value) {
    userStore.fetchUsersByAccount(currentAccountId.value)
  } else {
    userStore.fetchUsers()
  }
})
</script>

<style scoped lang="scss">
.user-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

    p {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }
}

.filter-card {
  margin-bottom: 20px;
}

.user-info {
  .user-name {
    font-weight: 500;
    color: var(--el-text-color-primary);

    .user-name-clickable {
      cursor: pointer;
      color: var(--el-color-primary);
      font-weight: 500;
      font-size: 14px;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary-light-3);
        text-decoration: underline;
      }
    }
  }

  .user-id {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-family: monospace;
    margin-top: 2px;
  }

  .user-description {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-top: 4px;
    font-style: italic;
  }
}

.account-info {
  .account-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  .account-id {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    font-family: monospace;
  }
}

.key-field {
  display: flex;
  align-items: center;
  gap: 8px;

  .key-text {
    background: var(--el-bg-color-page);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }
}

.permissions-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .permission-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .permission-tag {
    font-size: 10px;
    font-weight: 500;
  }

  .no-permissions {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }
}

.limits-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .limit-item {
    display: flex;
    align-items: center;
    font-size: 11px;

    .limit-label {
      color: var(--el-text-color-regular);
      margin-right: 4px;
      min-width: 28px;
    }

    .limit-value {
      color: var(--el-text-color-primary);
      font-weight: 500;
      font-family: monospace;
    }
  }
}

.no-limits {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.time-info {
  .time-row {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
    font-size: 11px;

    &:last-child {
      margin-bottom: 0;
    }

    .time-label {
      color: var(--el-text-color-secondary);
      min-width: 32px;
      font-size: 10px;
    }

    .time-value {
      color: var(--el-text-color-primary);
      font-family: monospace;
      font-size: 11px;
    }
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

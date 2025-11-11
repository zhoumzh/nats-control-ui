<template>
  <div class="user-detail">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button @click="goBack" size="small" text>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="title-section">
            <h1>{{ user?.name || '用户详情' }}</h1>
            <p>{{ user?.id }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button v-if="!isEditing" @click="startEdit" type="primary">
            <el-icon><Edit /></el-icon>
            编辑用户
          </el-button>
          <template v-else>
            <el-button @click="cancelEdit"> 取消 </el-button>
            <el-button @click="saveEdit" type="primary" :loading="saveLoading"> 保存 </el-button>
          </template>
          <el-dropdown @command="handleAction" trigger="click">
            <el-button type="danger" plain>
              <el-icon><MoreFilled /></el-icon>
              更多操作
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="user?.status === 'active' ? 'disable' : 'enable'">
                  <el-icon v-if="user?.status === 'active'"><Lock /></el-icon>
                  <el-icon v-else><Unlock /></el-icon>
                  {{ user?.status === 'active' ? '禁用用户' : '启用用户' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除用户
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="content">
      <div v-if="user" class="user-content">
        <!-- 基本信息卡片 -->
        <el-card class="info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="user.status === 'active' ? 'success' : 'danger'">
                {{ user.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <label>用户名称</label>
              <div class="value">
                <span>{{ user.name }}</span>
              </div>
            </div>
            <div class="info-item">
              <label>用户描述</label>
              <div class="value">
                <el-input
                  v-if="isEditing"
                  v-model="editForm.description"
                  placeholder="请输入用户描述"
                  type="textarea"
                  :rows="2"
                />
                <span v-else>{{ user.description || '暂无描述' }}</span>
              </div>
            </div>
            <div class="info-item">
              <label>所属账户</label>
              <div class="value">
                <div class="account-info">
                  <div class="account-name">{{ getAccountName(user.account_id) }}</div>
                  <div class="account-id">{{ user.account_id }}</div>
                </div>
              </div>
            </div>
            <div class="info-item">
              <label>管理员权限</label>
              <div class="value">
                <el-switch
                  v-if="isEditing"
                  v-model="editForm.is_admin"
                  active-text="管理员"
                  inactive-text="普通用户"
                />
                <template v-else>
                  <el-tag v-if="user.is_admin" type="warning" size="small"> 管理员 </el-tag>
                  <el-tag v-else type="info" size="small" plain> 普通用户 </el-tag>
                </template>
              </div>
            </div>
            <div class="info-item public-key-item">
              <label>公钥</label>
              <div class="value">
                <div class="key-field">
                  <code class="key-text highlighted-key">{{ user.public_key }}</code>
                  <el-button text size="small" @click="copyToClipboard(user.public_key)">
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <div class="value">{{ formatDate(user.created_at) }}</div>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <div class="value">{{ formatDate(user.updated_at) }}</div>
            </div>
          </div>
        </el-card>

        <!-- 权限配置卡片 -->
        <el-card class="permissions-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>权限配置</span>
              <el-button
                v-if="isEditing"
                @click="addPermissionRule"
                size="small"
                type="primary"
                plain
              >
                <el-icon><Plus /></el-icon>
                添加权限
              </el-button>
            </div>
          </template>
          <div class="permissions-content">
            <div v-if="isEditing">
              <!-- 编辑模式的权限配置 - 使用tag形式 -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="permission-tag-section">
                    <h4>发布权限</h4>
                    <div class="permission-group-tags">
                      <label>允许</label>
                      <div class="tags-container">
                        <el-tag
                          v-for="tag in editForm.publishAllow"
                          :key="tag"
                          closable
                          @close="removePermissionTag('publishAllow', tag)"
                          type="success"
                          size="small"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-input
                          v-model="newPermissionInput.publishAllow"
                          placeholder="输入主题后按回车添加"
                          size="small"
                          style="width: 150px"
                          @keyup.enter="addPermissionTag('publishAllow')"
                          class="tag-input"
                        />
                      </div>
                    </div>
                    <div class="permission-group-tags">
                      <label>禁止</label>
                      <div class="tags-container">
                        <el-tag
                          v-for="tag in editForm.publishDeny"
                          :key="tag"
                          closable
                          @close="removePermissionTag('publishDeny', tag)"
                          type="danger"
                          size="small"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-input
                          v-model="newPermissionInput.publishDeny"
                          placeholder="输入主题后按回车添加"
                          size="small"
                          style="width: 150px"
                          @keyup.enter="addPermissionTag('publishDeny')"
                          class="tag-input"
                        />
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="permission-tag-section">
                    <h4>订阅权限</h4>
                    <div class="permission-group-tags">
                      <label>允许</label>
                      <div class="tags-container">
                        <el-tag
                          v-for="tag in editForm.subscribeAllow"
                          :key="tag"
                          closable
                          @close="removePermissionTag('subscribeAllow', tag)"
                          type="success"
                          size="small"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-input
                          v-model="newPermissionInput.subscribeAllow"
                          placeholder="输入主题后按回车添加"
                          size="small"
                          style="width: 150px"
                          @keyup.enter="addPermissionTag('subscribeAllow')"
                          class="tag-input"
                        />
                      </div>
                    </div>
                    <div class="permission-group-tags">
                      <label>禁止</label>
                      <div class="tags-container">
                        <el-tag
                          v-for="tag in editForm.subscribeDeny"
                          :key="tag"
                          closable
                          @close="removePermissionTag('subscribeDeny', tag)"
                          type="danger"
                          size="small"
                        >
                          {{ tag }}
                        </el-tag>
                        <el-input
                          v-model="newPermissionInput.subscribeDeny"
                          placeholder="输入主题后按回车添加"
                          size="small"
                          style="width: 150px"
                          @keyup.enter="addPermissionTag('subscribeDeny')"
                          class="tag-input"
                        />
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <div v-else>
              <!-- 显示模式的权限配置 - 使用紧凑表格布局 -->
              <div v-if="user.permissions" class="permissions-table">
                <el-table :data="permissionTableData" size="small" :show-header="false">
                  <el-table-column prop="type" width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.type === '发布' ? 'primary' : 'success'" size="small">
                        {{ row.type }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="rule" width="60">
                    <template #default="{ row }">
                      <span class="rule-label">{{ row.rule }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="subjects">
                    <template #default="{ row }">
                      <div v-if="row.subjects.length" class="subjects-list-compact">
                        <el-tag
                          v-for="subject in row.subjects"
                          :key="subject"
                          size="small"
                          :type="row.rule === '允许' ? 'success' : 'danger'"
                          class="subject-tag"
                        >
                          {{ subject }}
                        </el-tag>
                      </div>
                      <span v-else class="no-rules">无规则</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="no-permissions">
                <el-empty description="暂无权限配置" :image-size="60" />
              </div>
            </div>
          </div>
        </el-card>

        <!-- Claims信息卡片 -->
        <el-card class="claims-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>Claims信息</span>
              <el-button
                v-if="claims"
                @click="copyToClipboard(JSON.stringify(claims, null, 2))"
                size="small"
                text
              >
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
            </div>
          </template>
          <div class="claims-content">
            <div v-if="claims" class="claims-display">
              <pre>{{ JSON.stringify(claims, null, 2) }}</pre>
            </div>
            <div v-else class="no-claims">
              <el-empty description="暂无Claims信息" :image-size="60" />
            </div>
          </div>
        </el-card>

        <!-- Creds文件卡片 -->
        <el-card class="creds-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>Creds文件</span>
              <div class="header-buttons">
                <el-button
                  v-if="credsContent"
                  @click="copyToClipboard(credsContent)"
                  size="small"
                  text
                >
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
                <el-button
                  @click="downloadCreds"
                  :loading="downloadLoading"
                  size="small"
                  type="primary"
                >
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
              </div>
            </div>
          </template>
          <div class="creds-content">
            <div v-if="credsContent" class="creds-display">
              <pre>{{ credsContent }}</pre>
            </div>
            <div v-else class="no-creds">
              <el-empty description="暂无Creds文件内容" />
              <el-button @click="generateCredsContent" :loading="credsLoading" type="primary">
                生成Creds文件
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 限制配置卡片 -->
        <el-card v-if="user.limits" class="limits-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>限制配置</span>
            </div>
          </template>
          <div class="limits-content">
            <div class="info-grid">
              <div class="info-item">
                <label>最大数据量</label>
                <div class="value">{{ formatBytes(user.limits.max_data) }}</div>
              </div>
              <div class="info-item">
                <label>最大载荷大小</label>
                <div class="value">{{ formatBytes(user.limits.max_payload) }}</div>
              </div>
              <div class="info-item">
                <label>最大订阅数</label>
                <div class="value">{{ user.limits.max_subscriptions }}</div>
              </div>
              <div v-if="user.limits.connection_types?.length" class="info-item">
                <label>允许的连接类型</label>
                <div class="value">
                  <div class="subjects-list">
                    <el-tag
                      v-for="type in user.limits.connection_types"
                      :key="type"
                      size="small"
                      type="info"
                    >
                      {{ type }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
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
  ArrowLeft,
  Download,
  Edit,
  MoreFilled,
  Lock,
  Unlock,
  Delete,
  DocumentCopy,
  Plus,
} from '@element-plus/icons-vue'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()

const loading = ref(false)
const downloadLoading = ref(false)
const credsLoading = ref(false)
const saveLoading = ref(false)
const isEditing = ref(false)
const user = ref<User | null>(null)
const credsContent = ref<string>('')
const claims = ref<any>(null)

// 编辑表单
const editForm = ref({
  description: '',
  is_admin: false,
  publishAllow: [] as string[],
  publishDeny: [] as string[],
  subscribeAllow: [] as string[],
  subscribeDeny: [] as string[],
})

// 新权限输入框的值
const newPermissionInput = ref({
  publishAllow: '',
  publishDeny: '',
  subscribeAllow: '',
  subscribeDeny: '',
})

const userId = computed(() => route.params.id as string)

// 权限表格数据
const permissionTableData = computed(() => {
  if (!user.value?.permissions) return []

  const data = []

  // 发布权限
  if (user.value.permissions.publish?.allow?.length) {
    data.push({
      type: '发布',
      rule: '允许',
      subjects: user.value.permissions.publish.allow,
    })
  }
  if (user.value.permissions.publish?.deny?.length) {
    data.push({
      type: '发布',
      rule: '禁止',
      subjects: user.value.permissions.publish.deny,
    })
  }

  // 订阅权限
  if (user.value.permissions.subscribe?.allow?.length) {
    data.push({
      type: '订阅',
      rule: '允许',
      subjects: user.value.permissions.subscribe.allow,
    })
  }
  if (user.value.permissions.subscribe?.deny?.length) {
    data.push({
      type: '订阅',
      rule: '禁止',
      subjects: user.value.permissions.subscribe.deny,
    })
  }

  return data
})

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const goBack = () => {
  router.back()
}

const downloadCreds = async () => {
  if (!user.value) return

  downloadLoading.value = true
  try {
    const blob = await userApi.downloadCreds(user.value.id)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${user.value.name}.creds`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('Creds文件下载成功')
  } catch (error) {
    console.error('Failed to download creds:', error)
    ElMessage.error('下载Creds文件失败')
  } finally {
    downloadLoading.value = false
  }
}

const generateCredsContent = async () => {
  if (!user.value) return

  credsLoading.value = true
  try {
    const response = await userApi.getUserCreds(user.value.id)
    credsContent.value = response.creds_content
    ElMessage.success('Creds文件生成成功')
  } catch (error) {
    console.error('Failed to generate creds:', error)
    ElMessage.error('生成Creds文件失败')
  } finally {
    credsLoading.value = false
  }
}

const fetchCredsContent = async () => {
  if (!user.value) return

  try {
    const response = await userApi.getUserCreds(user.value.id)
    credsContent.value = response.creds_content
  } catch (error) {
    console.error('Failed to fetch creds content:', error)
    // 不显示错误消息，因为这是静默获取
  }
}

const startEdit = () => {
  if (!user.value) return

  isEditing.value = true

  // 初始化编辑表单
  editForm.value = {
    description: user.value.description || '',
    is_admin: user.value.is_admin || false,
    publishAllow: user.value.permissions?.publish?.allow || [],
    publishDeny: user.value.permissions?.publish?.deny || [],
    subscribeAllow: user.value.permissions?.subscribe?.allow || [],
    subscribeDeny: user.value.permissions?.subscribe?.deny || [],
  }

  // 重置输入框
  newPermissionInput.value = {
    publishAllow: '',
    publishDeny: '',
    subscribeAllow: '',
    subscribeDeny: '',
  }
}

const cancelEdit = () => {
  isEditing.value = false
  // 重置表单
  editForm.value = {
    description: '',
    is_admin: false,
    publishAllow: [],
    publishDeny: [],
    subscribeAllow: [],
    subscribeDeny: [],
  }
  // 重置输入框
  newPermissionInput.value = {
    publishAllow: '',
    publishDeny: '',
    subscribeAllow: '',
    subscribeDeny: '',
  }
}

const saveEdit = async () => {
  if (!user.value) return

  saveLoading.value = true

  try {
    // 构建符合后端 UpdateUserRequest 接口的更新数据
    const updateData = {
      name: user.value.name,
      description: editForm.value.description,
      status: user.value.status,
      is_admin: editForm.value.is_admin,
      permissions: {
        publish: {
          allow: editForm.value.publishAllow,
          deny: editForm.value.publishDeny,
        },
        subscribe: {
          allow: editForm.value.subscribeAllow,
          deny: editForm.value.subscribeDeny,
        },
        response: user.value.permissions?.response || undefined,
      },
    }

    const updatedUser = await userApi.updateUser(user.value.id, updateData)
    user.value = updatedUser
    isEditing.value = false

    ElMessage.success('用户信息更新成功')

    // 重新获取creds内容，因为权限变更可能影响JWT
    await fetchCredsContent()
  } catch (error) {
    console.error('Failed to update user:', error)
    ElMessage.error('更新用户信息失败')
  } finally {
    saveLoading.value = false
  }
}

// 添加权限tag
const addPermissionTag = (type: keyof typeof editForm.value) => {
  const input = newPermissionInput.value[type as keyof typeof newPermissionInput.value]
  if (!input.trim()) return

  // 检查是否已存在
  if (editForm.value[type].includes(input.trim())) {
    ElMessage.warning('该权限规则已存在')
    return
  }

  editForm.value[type].push(input.trim())
  newPermissionInput.value[type as keyof typeof newPermissionInput.value] = ''
}

// 移除权限tag
const removePermissionTag = (type: keyof typeof editForm.value, tag: string) => {
  const index = editForm.value[type].indexOf(tag)
  if (index > -1) {
    editForm.value[type].splice(index, 1)
  }
}

const addPermissionRule = () => {
  // 这个方法可以用于将来扩展更复杂的权限配置UI
  ElMessage.info('可通过上方文本框编辑权限规则')
}

const handleAction = async (action: string) => {
  if (!user.value) return

  switch (action) {
    case 'enable':
      try {
        await userStore.enableUser(user.value.id)
        await fetchUser() // 重新获取用户信息
        ElMessage.success('用户已启用')
      } catch (error) {
        console.error('Failed to enable user:', error)
        ElMessage.error('启用用户失败')
      }
      break

    case 'disable':
      try {
        await ElMessageBox.confirm(
          '禁用后，该用户将无法连接到NATS服务器。确定要禁用此用户吗？',
          '禁用用户',
          {
            confirmButtonText: '确定禁用',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        await userStore.disableUser(user.value.id)
        await fetchUser() // 重新获取用户信息
        ElMessage.success('用户已禁用')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to disable user:', error)
          ElMessage.error('禁用用户失败')
        }
      }
      break

    case 'delete':
      try {
        await ElMessageBox.confirm(
          '删除用户是不可逆操作，该用户的所有数据和配置将被永久删除。确定要删除此用户吗？',
          '删除用户',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'error',
          }
        )
        await userStore.deleteUser(user.value.id)
        ElMessage.success('用户删除成功')
        router.push('/users')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Failed to delete user:', error)
          ElMessage.error('删除用户失败')
        }
      }
      break
  }
}

const fetchUser = async () => {
  if (!userId.value) return

  loading.value = true
  try {
    user.value = await userApi.getUser(userId.value)
    // 获取用户信息后，同时获取creds内容和claims信息
    await Promise.all([fetchCredsContent(), fetchClaims()])
  } catch (error) {
    console.error('Failed to fetch user:', error)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const fetchClaims = async () => {
  if (!user.value) return

  try {
    // 直接从用户详情API获取JWT信息
    const userResponse = await userApi.getUser(user.value.id)
    if (userResponse.jwt_claims) {
      claims.value = userResponse.jwt_claims
      console.log('JWT claims loaded from user response:', userResponse.jwt_claims)
    } else {
      console.warn('No JWT claims found in user response')
      claims.value = null
    }
  } catch (error) {
    console.error('Failed to fetch claims:', error)
    // 不显示错误消息，因为这是静默获取
  }
}

onMounted(async () => {
  // Load accounts first if not already loaded
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts()
  }

  // Load user details
  await fetchUser()
})
</script>

<style scoped lang="scss">
.user-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;

      .title-section {
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--el-text-color-primary);
        }

        p {
          color: var(--el-text-color-regular);
          font-size: 14px;
          font-family: monospace;
          margin: 0;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.content {
  min-height: 400px;
}

.user-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
  }

  .value {
    font-size: 14px;
    color: var(--el-text-color-primary);

    code {
      background: var(--el-bg-color-page);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
    }
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
    margin-top: 2px;
  }
}

.key-field {
  display: flex;
  align-items: center;
  gap: 8px;

  .key-text {
    flex: 1;
    word-break: break-all;
  }

  .highlighted-key {
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 6px;
  }
}

.public-key-item {
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-color-primary-light-9);

  label {
    color: var(--el-color-primary) !important;
    font-weight: 600 !important;
    font-size: 15px !important;
  }
}

.permissions-content {
  .permission-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }

    .permission-details {
      .permission-group {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-regular);
          margin-bottom: 8px;
        }

        .subjects-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }

  .no-permissions {
    text-align: center;
    padding: 40px 0;
  }
}

.limits-content {
  .subjects-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.creds-content {
  .creds-display {
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .no-creds {
    text-align: center;
    padding: 40px 0;
  }
}

.claims-content {
  .claims-display {
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .no-claims {
    text-align: center;
    padding: 20px 0;
  }
}

.permission-compact-section {
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }
}

.permission-group-compact {
  position: relative;
  margin-bottom: 12px;

  .input-label {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    background: var(--el-bg-color);
    padding: 0 4px;
    z-index: 1;
  }
}

.permissions-table {
  .rule-label {
    font-size: 12px;
    color: var(--el-text-color-regular);
  }

  .subjects-list-compact {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .subject-tag {
    font-size: 11px;
    height: 20px;
    line-height: 18px;
  }

  .no-rules {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
}

.permission-edit-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
  }

  .permission-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
    }
  }
}
</style>

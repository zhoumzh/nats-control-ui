<template>
  <div class="user-form">
    <div class="page-header">
      <el-button text @click="$router.back()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <p>{{ isEdit ? '更新用户设置和权限' : '创建具有特定权限和限制的新NATS用户' }}</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="180px"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="20">
        <!-- Basic Information -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>{{ isEdit ? '编辑用户' : '创建用户' }}</span>
            </template>

            <el-form-item label="用户名" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入用户名"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="账户" prop="account_id">
              <el-select
                v-model="form.account_id"
                placeholder="请选择账户"
                filterable
                style="width: 100%"
                :disabled="!!preselectedAccountId"
              >
                <el-option
                  v-for="account in accountStore.accounts"
                  :key="account.id"
                  :label="`${account.name} (${account.id})`"
                  :value="account.id"
                  :disabled="account.status === 'disabled'"
                />
              </el-select>
              <div v-if="preselectedAccountId" class="help-text">账户已从上下文中预选择</div>
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="active">
                  <el-tag type="success" size="small">启用</el-tag>
                  <span class="radio-label">用户已启用且可以连接</span>
                </el-radio>
                <el-radio value="disabled">
                  <el-tag type="danger" size="small">禁用</el-tag>
                  <span class="radio-label">用户已禁用且无法连接</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="管理员权限" prop="is_admin">
              <el-switch v-model="form.is_admin" active-text="是管理员" inactive-text="普通用户" />
              <div class="help-text">管理员用户具有系统管理权限</div>
            </el-form-item>
          </el-card>
        </el-col>

        <!-- Permissions -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>权限</span>
                <el-switch v-model="permissionsEnabled" @change="handlePermissionsToggle" />
              </div>
            </template>

            <div v-if="permissionsEnabled">
              <!-- Publish Permissions -->
              <el-form-item label="发布允许">
                <el-input
                  v-model="publishAllowText"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入允许发布的主题（每行一个）&#10;示例：&#10;foo.bar&#10;events.>&#10;user.*.updates"
                  @input="updatePublishAllow"
                />
                <div class="help-text">使用通配符：* 表示单个令牌，> 表示多个令牌</div>
              </el-form-item>

              <el-form-item label="发布拒绝">
                <el-input
                  v-model="publishDenyText"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入拒绝发布的主题（每行一个）"
                  @input="updatePublishDeny"
                />
                <div class="help-text">拒绝规则优先于允许规则</div>
              </el-form-item>

              <!-- Subscribe Permissions -->
              <el-form-item label="订阅允许">
                <el-input
                  v-model="subscribeAllowText"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入允许订阅的主题（每行一个）&#10;示例：&#10;foo.bar&#10;events.>&#10;responses.*.{{UserID}}"
                  @input="updateSubscribeAllow"
                />
                <div class="help-text">使用 {{ UserID }} 表示用户特定主题</div>
              </el-form-item>

              <el-form-item label="订阅拒绝">
                <el-input
                  v-model="subscribeDenyText"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入拒绝订阅的主题（每行一个）"
                  @input="updateSubscribeDeny"
                />
              </el-form-item>

              <!-- Response Permissions -->
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="最大响应消息数">
                    <el-input-number
                      v-model="form.permissions.response_max_messages"
                      :min="0"
                      :max="1000"
                      placeholder="0"
                      style="width: 100%"
                    />
                    <div class="help-text">最大响应消息数量</div>
                  </el-form-item>
                </el-col>

                <el-col :span="12">
                  <el-form-item label="响应过期时间（秒）">
                    <el-input-number
                      v-model="form.permissions.response_expires"
                      :min="0"
                      :max="3600"
                      placeholder="0"
                      style="width: 100%"
                    />
                    <div class="help-text">响应权限过期时间</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <div v-else class="disabled-permissions">
              <el-alert
                title="权限已禁用"
                description="用户将继承账户默认权限。"
                type="info"
                show-icon
                :closable="false"
              />
            </div>
          </el-card>
        </el-col>

        <!-- User Limits -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>用户限制</span>
                <el-switch v-model="limitsEnabled" @change="handleLimitsToggle" />
              </div>
            </template>

            <div v-if="limitsEnabled">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="最大数据量">
                    <StorageInput
                      :value="form.limits.max_data_value"
                      :unit="form.limits.max_data_unit"
                      :allow-unlimited="true"
                      @update:value="form.limits.max_data_value = $event"
                      @update:unit="form.limits.max_data_unit = $event"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="8">
                  <el-form-item label="最大载荷">
                    <StorageInput
                      :value="form.limits.max_payload_value"
                      :unit="form.limits.max_payload_unit"
                      :allow-unlimited="true"
                      @update:value="form.limits.max_payload_value = $event"
                      @update:unit="form.limits.max_payload_unit = $event"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="8">
                  <el-form-item label="最大订阅数">
                    <el-input-number
                      v-model="form.limits.max_subscriptions"
                      :min="-1"
                      :max="10000"
                      placeholder="不限制"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- Access Controls -->
              <el-divider content-position="left">访问控制</el-divider>

              <el-form-item label="允许的源IP">
                <el-input
                  v-model="sourceIpsText"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入允许的源IP地址/范围（每行一个）&#10;示例：&#10;192.168.1.0/24&#10;10.0.0.1"
                  @input="updateSourceIps"
                />
                <div class="help-text">支持CIDR表示法。留空表示无IP限制。</div>
              </el-form-item>

              <el-form-item label="连接类型">
                <el-checkbox-group v-model="form.limits.connection_types">
                  <el-checkbox value="standard">标准</el-checkbox>
                  <el-checkbox value="websocket">WebSocket</el-checkbox>
                  <el-checkbox value="leafnode">叶节点</el-checkbox>
                </el-checkbox-group>
                <div class="help-text">选择允许的连接类型</div>
              </el-form-item>
            </div>

            <div v-else class="disabled-limits">
              <el-alert
                title="用户限制已禁用"
                description="用户将仅受账户限制约束。"
                type="info"
                show-icon
                :closable="false"
              />
            </div>
          </el-card>
        </el-col>

        <!-- Key Information (Edit only) -->
        <el-col v-if="isEdit" :span="24">
          <el-card>
            <template #header>
              <span>密钥信息</span>
            </template>

            <el-form-item label="公钥">
              <div class="key-display">
                <el-input :value="currentUser?.public_key" readonly class="key-input" />
                <el-button
                  @click="copyToClipboard(currentUser?.public_key)"
                  style="margin-left: 8px"
                >
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="私钥">
              <div class="key-display">
                <el-input
                  :value="showPrivateKey ? currentUser?.nkey : '••••••••••••••••••••••••••••••••'"
                  readonly
                  class="key-input"
                />
                <el-button @click="togglePrivateKey" style="margin-left: 8px">
                  <el-icon><View v-if="!showPrivateKey" /><Hide v-else /></el-icon>
                  {{ showPrivateKey ? '隐藏' : '显示' }}
                </el-button>
                <el-button
                  v-if="showPrivateKey"
                  @click="copyToClipboard(currentUser?.nkey)"
                  style="margin-left: 8px"
                >
                  <el-icon><DocumentCopy /></el-icon>
                  复制
                </el-button>
              </div>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>

      <!-- Form Actions -->
      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新用户' : '创建用户' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/users'
import { useAccountStore } from '@/stores/accounts'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { ArrowLeft, DocumentCopy, View, Hide } from '@element-plus/icons-vue'
import type { UserForm, UserPermissionsForm, UserLimitsForm, StorageUnit } from '@/types'
import StorageInput from '@/components/StorageInput.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const permissionsEnabled = ref(false)
const limitsEnabled = ref(false)
const showPrivateKey = ref(false)

// Text representations for array fields
const publishAllowText = ref('')
const publishDenyText = ref('')
const subscribeAllowText = ref('')
const subscribeDenyText = ref('')
const sourceIpsText = ref('')

const isEdit = computed(() => !!route.params.id)
const currentUser = computed(() => userStore.currentUser)
const preselectedAccountId = computed(() => route.query.accountId as string)

const form = reactive<UserForm & { permissions: UserPermissionsForm; limits: UserLimitsForm }>({
  name: '',
  account_id: preselectedAccountId.value || '',
  status: 'active',
  is_admin: false,
  permissions: {
    publish_allow: [],
    publish_deny: [],
    subscribe_allow: [],
    subscribe_deny: [],
    response_max_messages: 0,
    response_expires: 0,
  },
  limits: {
    max_data_value: 1,
    max_data_unit: 'GB' as StorageUnit,
    max_payload_value: 1,
    max_payload_unit: 'MB' as StorageUnit,
    max_subscriptions: -1,
    source_ips: [],
    connection_types: ['standard'],
  },
})

const rules = {
  name: [
    { required: true, message: '用户名为必填项', trigger: 'blur' },
    { min: 2, max: 100, message: '长度应为2到100个字符', trigger: 'blur' },
  ],
  account_id: [{ required: true, message: '账户选择为必填项', trigger: 'change' }],
}

const updatePublishAllow = () => {
  form.permissions.publish_allow = publishAllowText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const updatePublishDeny = () => {
  form.permissions.publish_deny = publishDenyText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const updateSubscribeAllow = () => {
  form.permissions.subscribe_allow = subscribeAllowText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const updateSubscribeDeny = () => {
  form.permissions.subscribe_deny = subscribeDenyText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const updateSourceIps = () => {
  form.limits.source_ips = sourceIpsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const handlePermissionsToggle = (enabled: boolean) => {
  if (!enabled) {
    form.permissions = {
      publish_allow: [],
      publish_deny: [],
      subscribe_allow: [],
      subscribe_deny: [],
      response_max_messages: 0,
      response_expires: 0,
    }
    publishAllowText.value = ''
    publishDenyText.value = ''
    subscribeAllowText.value = ''
    subscribeDenyText.value = ''
  }
}

const handleLimitsToggle = (enabled: boolean) => {
  if (!enabled) {
    form.limits = {
      max_data_value: 1,
      max_data_unit: 'GB' as StorageUnit,
      max_payload_value: 1,
      max_payload_unit: 'MB' as StorageUnit,
      max_subscriptions: -1,
      source_ips: [],
      connection_types: ['standard'],
    }
    sourceIpsText.value = ''
  }
}

const copyToClipboard = async (text?: string) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const togglePrivateKey = () => {
  showPrivateKey.value = !showPrivateKey.value
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    const formData: UserForm = {
      name: form.name,
      account_id: form.account_id,
      status: form.status,
      is_admin: form.is_admin,
      permissions: permissionsEnabled.value
        ? {
            publish:
              form.permissions.publish_allow.length > 0 || form.permissions.publish_deny.length > 0
                ? {
                    allow: form.permissions.publish_allow,
                    deny: form.permissions.publish_deny,
                  }
                : undefined,
            subscribe:
              form.permissions.subscribe_allow.length > 0 ||
              form.permissions.subscribe_deny.length > 0
                ? {
                    allow: form.permissions.subscribe_allow,
                    deny: form.permissions.subscribe_deny,
                  }
                : undefined,
            response:
              form.permissions.response_max_messages > 0 || form.permissions.response_expires > 0
                ? {
                    max_messages: form.permissions.response_max_messages,
                    expires: form.permissions.response_expires,
                  }
                : undefined,
          }
        : undefined,
      limits: limitsEnabled.value
        ? {
            max_data_value: form.limits.max_data_value,
            max_data_unit: form.limits.max_data_unit,
            max_payload_value: form.limits.max_payload_value,
            max_payload_unit: form.limits.max_payload_unit,
            max_subscriptions: form.limits.max_subscriptions,
            access_controls:
              form.limits.source_ips.length > 0
                ? {
                    source_ips: form.limits.source_ips,
                  }
                : undefined,
            connection_types: form.limits.connection_types,
          }
        : undefined,
    }

    if (isEdit.value && route.params.id) {
      await userStore.updateUser(route.params.id as string, formData)
    } else {
      await userStore.createUser(formData)
    }

    router.back()
  } catch (error) {
    console.error('Failed to save user:', error)
  } finally {
    loading.value = false
  }
}

const loadUser = async () => {
  if (!isEdit.value || !route.params.id) return

  try {
    const user = await userStore.fetchUser(route.params.id as string)

    // Populate form with user data
    form.name = user.name
    form.account_id = user.account_id
    form.status = user.status
    form.is_admin = user.is_admin || false

    if (user.permissions) {
      permissionsEnabled.value = true

      if (user.permissions.publish) {
        form.permissions.publish_allow = user.permissions.publish.allow || []
        form.permissions.publish_deny = user.permissions.publish.deny || []
        publishAllowText.value = form.permissions.publish_allow.join('\n')
        publishDenyText.value = form.permissions.publish_deny.join('\n')
      }

      if (user.permissions.subscribe) {
        form.permissions.subscribe_allow = user.permissions.subscribe.allow || []
        form.permissions.subscribe_deny = user.permissions.subscribe.deny || []
        subscribeAllowText.value = form.permissions.subscribe_allow.join('\n')
        subscribeDenyText.value = form.permissions.subscribe_deny.join('\n')
      }

      if (user.permissions.response) {
        form.permissions.response_max_messages = user.permissions.response.max_messages
        form.permissions.response_expires = user.permissions.response.expires
      }
    }

    if (user.limits) {
      limitsEnabled.value = true
      form.limits = {
        max_data_value: user.limits.max_data_value || 1,
        max_data_unit: user.limits.max_data_unit || 'GB',
        max_payload_value: user.limits.max_payload_value || 1,
        max_payload_unit: user.limits.max_payload_unit || 'MB',
        max_subscriptions: user.limits.max_subscriptions,
        source_ips: user.limits.access_controls?.source_ips || [],
        connection_types: user.limits.connection_types || ['standard'],
      }
      sourceIpsText.value = form.limits.source_ips.join('\n')
    }
  } catch (error) {
    console.error('Failed to load user:', error)
    ElMessage.error('加载用户数据失败')
    router.back()
  }
}

onMounted(() => {
  // Load accounts if not already loaded
  if (accountStore.accounts.length === 0) {
    accountStore.fetchAccounts()
  }

  loadUser()
})
</script>

<style scoped lang="scss">
.user-form {
  padding: 20px;
  max-width: 100%;
  margin: 0;
}

.page-header {
  margin-bottom: 20px;

  .back-button {
    margin-bottom: 16px;
    color: var(--el-color-primary);
  }

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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.radio-label {
  margin-left: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.help-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.disabled-permissions,
.disabled-limits {
  padding: 20px 0;
}

.key-display {
  display: flex;
  align-items: center;

  .key-input {
    flex: 1;

    :deep(.el-input__inner) {
      font-family: monospace;
      font-size: 12px;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-card) {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
}
</style>

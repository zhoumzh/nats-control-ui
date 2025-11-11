<template>
  <div class="account-form">
    <div class="page-header">
      <el-button text @click="$router.back()" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <p>{{ isEdit ? '更新账户设置和配置' : '创建一个具有权限和限制的新NATS账户' }}</p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="150px"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="24">
        <!-- 基本信息 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>{{ isEdit ? '编辑账户' : '创建账户' }}</span>
            </template>

            <el-form-item label="账户名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入账户名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="请输入账户描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="active">
                  <el-tag type="success" size="small">活跃</el-tag>
                  <span class="radio-label">账户已启用且可正常运行</span>
                </el-radio>
                <el-radio value="disabled">
                  <el-tag type="danger" size="small">已禁用</el-tag>
                  <span class="radio-label">账户已禁用且无法使用</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="账户类型" prop="is_system_account">
              <!-- 编辑模式：只读显示 -->
              <div v-if="isEdit" class="readonly-field">
                <el-tag :type="form.is_system_account ? 'info' : 'warning'" size="small">
                  {{ form.is_system_account ? '系统账户' : '普通账户' }}
                </el-tag>
                <span class="readonly-description">
                  {{
                    form.is_system_account
                      ? '用于系统服务和集群管理的账户'
                      : '用于应用程序和用户的常规账户'
                  }}
                </span>
              </div>
              <!-- 创建模式：可选择 -->
              <el-radio-group v-else v-model="form.is_system_account">
                <el-radio :value="false">
                  <el-tag type="warning" size="small">普通账户</el-tag>
                  <span class="radio-label">用于应用程序和用户的常规账户</span>
                </el-radio>
                <el-radio :value="true">
                  <el-tag type="info" size="small">系统账户</el-tag>
                  <span class="radio-label">用于系统服务和集群管理的账户</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="所属集群" prop="origin_cluster_id">
              <!-- 编辑模式：只读显示 -->
              <div v-if="isEdit" class="readonly-field">
                <el-tag type="primary" size="small">
                  {{ displayClusterName }}
                </el-tag>
              </div>
              <!-- 创建模式：必填下拉选择 -->
              <el-select
                v-else
                v-model="form.origin_cluster_id"
                placeholder="请选择所属集群"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="cluster in clusterStore.clusters"
                  :key="cluster.id"
                  :label="cluster.name"
                  :value="cluster.id"
                />
              </el-select>
            </el-form-item>

          </el-card>
        </el-col>

        <!-- 账户限制 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>账户限制</span>
                <div class="limits-toggle">
                  <el-switch v-model="limitsEnabled" @change="handleLimitsToggle" />
                </div>
              </div>
            </template>

            <div v-if="limitsEnabled">
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="最大连接数" prop="limits.max_connections">
                    <el-input-number
                      v-model="form.limits.max_connections"
                      :min="-1"
                      :max="1000000"
                      placeholder="无限制"
                      style="width: 100%"
                    />
                    <div class="help-text">设置为-1表示无限连接</div>
                  </el-form-item>
                </el-col>

                <el-col :span="8">
                  <el-form-item label="最大订阅数" prop="limits.max_subscriptions">
                    <el-input-number
                      v-model="form.limits.max_subscriptions"
                      :min="-1"
                      :max="1000000"
                      placeholder="无限制"
                      style="width: 100%"
                    />
                    <div class="help-text">最大订阅数量</div>
                  </el-form-item>
                </el-col>

                <el-col :span="8">
                  <el-form-item label="最大叶节点数" prop="limits.max_leaf_nodes">
                    <el-input-number
                      v-model="form.limits.max_leaf_nodes"
                      :min="-1"
                      :max="1000000"
                      placeholder="无限制"
                      style="width: 100%"
                    />
                    <div class="help-text">设置为-1表示无限叶节点</div>
                  </el-form-item>
                </el-col>

                <el-col :span="24">
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

                <el-col :span="24">
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
              </el-row>

              <!-- JetStream配置 -->
              <el-divider content-position="left">JetStream配置</el-divider>

              <el-form-item label="启用JetStream">
                <el-switch v-model="jetStreamEnabled" @change="handleJetStreamToggle" />
                <div class="help-text">启用JetStream进行持久化消息传递</div>
              </el-form-item>

              <div v-if="jetStreamEnabled">
                <el-row :gutter="16">
                  <el-col :span="24">
                    <el-form-item label="内存存储">
                      <StorageInput
                        :value="form.limits.jetstream_limits!.memory_storage_value"
                        :unit="form.limits.jetstream_limits!.memory_storage_unit"
                        :allow-unlimited="true"
                        @update:value="form.limits.jetstream_limits!.memory_storage_value = $event"
                        @update:unit="form.limits.jetstream_limits!.memory_storage_unit = $event"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="磁盘存储">
                      <StorageInput
                        :value="form.limits.jetstream_limits!.disk_storage_value"
                        :unit="form.limits.jetstream_limits!.disk_storage_unit"
                        :allow-unlimited="true"
                        @update:value="form.limits.jetstream_limits!.disk_storage_value = $event"
                        @update:unit="form.limits.jetstream_limits!.disk_storage_unit = $event"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="8">
                    <el-form-item label="最大流数">
                      <el-input-number
                        v-model="form.limits.jetstream_limits!.streams"
                        :min="0"
                        :max="1000"
                        placeholder="0"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="8">
                    <el-form-item label="最大消费者数">
                      <el-input-number
                        v-model="form.limits.jetstream_limits!.consumers"
                        :min="0"
                        :max="1000"
                        placeholder="0"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="8">
                    <el-form-item label="最大待确认数">
                      <el-input-number
                        v-model="form.limits.jetstream_limits!.max_ack_pending"
                        :min="0"
                        :max="10000"
                        placeholder="0"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="内存最大流字节数">
                      <StorageInput
                        :value="form.limits.jetstream_limits!.memory_max_stream_bytes_value"
                        :unit="form.limits.jetstream_limits!.memory_max_stream_bytes_unit"
                        :allow-unlimited="true"
                        @update:value="
                          form.limits.jetstream_limits!.memory_max_stream_bytes_value = $event
                        "
                        @update:unit="
                          form.limits.jetstream_limits!.memory_max_stream_bytes_unit = $event
                        "
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="磁盘最大流字节数">
                      <StorageInput
                        :value="form.limits.jetstream_limits!.disk_max_stream_bytes_value"
                        :unit="form.limits.jetstream_limits!.disk_max_stream_bytes_unit"
                        :allow-unlimited="true"
                        @update:value="
                          form.limits.jetstream_limits!.disk_max_stream_bytes_value = $event
                        "
                        @update:unit="
                          form.limits.jetstream_limits!.disk_max_stream_bytes_unit = $event
                        "
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="24">
                    <el-form-item label="要求最大字节数">
                      <el-switch v-model="form.limits.jetstream_limits!.max_bytes_required" />
                      <div class="help-text">要求在流上设置max_bytes</div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>

            <div v-else class="disabled-limits">
              <el-alert
                title="账户限制已禁用"
                description="不会对此账户应用任何限制。用户将根据其个人权限获得无限制访问。"
                type="info"
                show-icon
                :closable="false"
              />
            </div>
          </el-card>
        </el-col>

        <!-- Import/Export 配置 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>Import/Export 配置</span>
            </template>

            <el-tabs v-model="importExportTab">
              <!-- Exports Tab -->
              <el-tab-pane label="Exports" name="exports">
                <div class="import-export-section">
                  <div class="section-header">
                    <span>导出配置</span>
                    <el-button type="primary" size="small" @click="addExport">
                      <el-icon><Plus /></el-icon>
                      添加Export
                    </el-button>
                  </div>

                  <div
                    v-if="form.limits?.exports && form.limits.exports.length > 0"
                    class="export-list"
                  >
                    <div
                      v-for="(exportItem, index) in form.limits.exports"
                      :key="index"
                      class="export-item"
                    >
                      <el-card>
                        <div class="export-header">
                          <span class="export-name">{{ exportItem.name }}</span>
                          <el-button type="danger" size="small" text @click="removeExport(index)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                        <el-row :gutter="16">
                          <el-col :span="12">
                            <el-form-item
                              :label="'导出名称'"
                              :prop="'limits.exports.' + index + '.name'"
                            >
                              <el-input v-model="exportItem.name" placeholder="export名称" />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item
                              :label="'主题'"
                              :prop="'limits.exports.' + index + '.subject'"
                            >
                              <el-input v-model="exportItem.subject" placeholder="主题模式" />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item
                              :label="'类型'"
                              :prop="'limits.exports.' + index + '.type'"
                            >
                              <el-select v-model="exportItem.type" placeholder="选择类型">
                                <el-option label="Stream" value="stream" />
                                <el-option label="Service" value="service" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item label="需要Token">
                              <el-switch v-model="exportItem.token_req" />
                            </el-form-item>
                          </el-col>
                          <el-col :span="24">
                            <el-form-item label="描述">
                              <el-input
                                v-model="exportItem.info!.description"
                                type="textarea"
                                placeholder="描述信息"
                              />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-card>
                    </div>
                  </div>
                  <div v-else class="empty-state">
                    <el-empty description="暂无Export配置" />
                  </div>
                </div>
              </el-tab-pane>

              <!-- Imports Tab -->
              <el-tab-pane label="Imports" name="imports">
                <div class="import-export-section">
                  <div class="section-header">
                    <span>导入配置</span>
                    <el-button type="primary" size="small" @click="addImport">
                      <el-icon><Plus /></el-icon>
                      添加Import
                    </el-button>
                  </div>

                  <div
                    v-if="form.limits?.imports && form.limits.imports.length > 0"
                    class="import-list"
                  >
                    <div
                      v-for="(importItem, index) in form.limits.imports"
                      :key="index"
                      class="import-item"
                    >
                      <el-card>
                        <div class="import-header">
                          <span class="import-name">{{ importItem.name }}</span>
                          <el-button type="danger" size="small" text @click="removeImport(index)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                        <el-row :gutter="16">
                          <el-col :span="12">
                            <el-form-item
                              :label="'导入名称'"
                              :prop="'limits.imports.' + index + '.name'"
                            >
                              <el-input v-model="importItem.name" placeholder="import名称" />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item
                              :label="'主题'"
                              :prop="'limits.imports.' + index + '.subject'"
                            >
                              <el-input v-model="importItem.subject" placeholder="主题模式" />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item
                              :label="'来源账户'"
                              :prop="'limits.imports.' + index + '.account'"
                            >
                              <el-select
                                v-model="importItem.account"
                                placeholder="选择账户"
                                filterable
                              >
                                <el-option
                                  v-for="account in accountStore.accounts"
                                  :key="account.id"
                                  :label="account.name"
                                  :value="account.id"
                                />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item
                              :label="'类型'"
                              :prop="'limits.imports.' + index + '.type'"
                            >
                              <el-select v-model="importItem.type" placeholder="选择类型">
                                <el-option label="Stream" value="stream" />
                                <el-option label="Service" value="service" />
                              </el-select>
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item label="Token">
                              <el-input
                                v-model="importItem.token"
                                placeholder="激活token（可选）"
                              />
                            </el-form-item>
                          </el-col>
                          <el-col :span="12">
                            <el-form-item label="映射到">
                              <el-input
                                v-model="importItem.to"
                                placeholder="本地主题映射（可选）"
                              />
                            </el-form-item>
                          </el-col>
                        </el-row>
                      </el-card>
                    </div>
                  </div>
                  <div v-else class="empty-state">
                    <el-empty description="暂无Import配置" />
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>

        <!-- 密钥信息（仅编辑模式） -->
        <el-col v-if="isEdit" :span="24">
          <el-card>
            <template #header>
              <span>密钥信息</span>
            </template>

            <el-form-item label="公钥">
              <div class="key-display">
                <el-input :value="currentAccount?.public_key" readonly class="key-input" />
                <el-button
                  @click="copyToClipboard(currentAccount?.public_key)"
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
                  :value="
                    showPrivateKey ? currentAccount?.nkey : '••••••••••••••••••••••••••••••••'
                  "
                  readonly
                  class="key-input"
                />
                <el-button @click="togglePrivateKey" style="margin-left: 8px">
                  <el-icon><View v-if="!showPrivateKey" /><Hide v-else /></el-icon>
                  {{ showPrivateKey ? '隐藏' : '显示' }}
                </el-button>
                <el-button
                  v-if="showPrivateKey"
                  @click="copyToClipboard(currentAccount?.nkey)"
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

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新账户' : '创建账户' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/accounts'
import { useClusterStore } from '@/stores/clusters'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  ArrowLeft,
  DocumentCopy,
  View,
  Hide,
  Plus,
  Delete,
} from '@element-plus/icons-vue'
import type { AccountForm, AccountLimitsForm, StorageUnit } from '@/types'
import { AccountStatus, ExportType, ImportType } from '@/types'
import StorageInput from '@/components/StorageInput.vue'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const clusterStore = useClusterStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const limitsEnabled = ref(false)
const jetStreamEnabled = ref(false)
const showPrivateKey = ref(false)
const importExportTab = ref('exports')

const isEdit = computed(() => !!route.params.id)
const currentAccount = computed(() => accountStore.currentAccount)

// 获取编辑模式下的集群名称
const displayClusterName = computed(() => {
  if (!isEdit.value || !currentAccount.value) return '缺失'
  
  // 优先使用后端返回的 cluster_name
  if (currentAccount.value.cluster_name) {
    return currentAccount.value.cluster_name
  }
  
  // 如果没有 cluster_name，根据 origin_cluster_id 查找
  if (currentAccount.value.origin_cluster_id) {
    const cluster = clusterStore.clusters.find(
      (c) => c.id === currentAccount.value!.origin_cluster_id
    )
    return cluster ? cluster.name : '缺失'
  }
  
  return '缺失'
})

const form = reactive<AccountForm & { limits: AccountLimitsForm; origin_cluster_id?: string }>({
  name: '',
  description: '',
  status: AccountStatus.ACTIVE,
  is_system_account: false, // 默认为普通账户
  origin_cluster_id: '', // 所属集群
  limits: {
    max_connections: -1,
    max_leaf_nodes: -1,
    max_data_value: 1,
    max_data_unit: 'GB' as StorageUnit,
    max_payload_value: 1,
    max_payload_unit: 'MB' as StorageUnit,
    max_subscriptions: -1,
    jetstream_limits: {
      enabled: false,
      memory_storage_value: 512,
      memory_storage_unit: 'MB' as StorageUnit,
      disk_storage_value: 1,
      disk_storage_unit: 'GB' as StorageUnit,
      streams: 0,
      consumers: 0,
      max_ack_pending: 0,
      memory_max_stream_bytes_value: 128,
      memory_max_stream_bytes_unit: 'MB' as StorageUnit,
      disk_max_stream_bytes_value: 256,
      disk_max_stream_bytes_unit: 'MB' as StorageUnit,
      max_bytes_required: false,
    },
    imports: [],
    exports: [],
  },
})

const rules = computed(() => ({
  name: [
    { required: true, message: '账户名称为必填项', trigger: 'blur' },
    { min: 2, max: 100, message: '长度应为2到100个字符', trigger: 'blur' },
  ],
  description: [{ max: 500, message: '描述不应超过500个字符', trigger: 'blur' }],
  origin_cluster_id: [
    { required: true, message: '所属集群为必填项', trigger: 'change' },
  ],
}))

const handleJetStreamToggle = (enabled: boolean) => {
  if (enabled) {
    // 启用JetStream，确保jetstream_limits存在并设置enabled为true
    if (!form.limits.jetstream_limits) {
      form.limits.jetstream_limits = {
        enabled: true,
        memory_storage_value: 512,
        memory_storage_unit: 'MB' as StorageUnit,
        disk_storage_value: 1,
        disk_storage_unit: 'GB' as StorageUnit,
        streams: 0,
        consumers: 0,
        max_ack_pending: 0,
        memory_max_stream_bytes_value: 128,
        memory_max_stream_bytes_unit: 'MB' as StorageUnit,
        disk_max_stream_bytes_value: 256,
        disk_max_stream_bytes_unit: 'MB' as StorageUnit,
        max_bytes_required: false,
      }
    } else {
      form.limits.jetstream_limits.enabled = true
    }
  } else {
    // 禁用JetStream
    if (form.limits.jetstream_limits) {
      form.limits.jetstream_limits.enabled = false
    }
  }
}

const handleLimitsToggle = (enabled: boolean) => {
  if (!enabled) {
    // Reset limits to unlimited when disabled
    form.limits = {
      max_connections: -1,
      max_leaf_nodes: -1,
      max_data_value: 1,
      max_data_unit: 'GB' as StorageUnit,
      max_payload_value: 1,
      max_payload_unit: 'MB' as StorageUnit,
      max_subscriptions: -1,
      jetstream_limits: {
        enabled: false,
        memory_storage_value: 512,
        memory_storage_unit: 'MB' as StorageUnit,
        disk_storage_value: 1,
        disk_storage_unit: 'GB' as StorageUnit,
        streams: 0,
        consumers: 0,
        max_ack_pending: 0,
        memory_max_stream_bytes_value: 128,
        memory_max_stream_bytes_unit: 'MB' as StorageUnit,
        disk_max_stream_bytes_value: 256,
        disk_max_stream_bytes_unit: 'MB' as StorageUnit,
        max_bytes_required: false,
      },
      imports: [],
      exports: [],
    }
    jetStreamEnabled.value = false
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



// Import/Export functions
const addExport = () => {
  if (!form.limits.exports) {
    form.limits.exports = []
  }
  form.limits.exports.push({
    name: '',
    subject: '',
    type: ExportType.STREAM,
    token_req: false,
    response_type: '',
    account_token_position: 0,
    revocations: [],
    info: {
      description: '',
      info_url: '',
    },
  })
}

const removeExport = (index: number) => {
  if (form.limits.exports) {
    form.limits.exports.splice(index, 1)
  }
}

const addImport = () => {
  if (!form.limits.imports) {
    form.limits.imports = []
  }
  form.limits.imports.push({
    name: '',
    subject: '',
    account: '',
    token: '',
    to: '',
    type: ImportType.STREAM,
  })
}

const removeImport = (index: number) => {
  if (form.limits.imports) {
    form.limits.imports.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    // 处理 imports：将 account_id 转换为 public_key
    const processedImports = form.limits.imports?.map((importItem) => {
      // 根据 account_id 查找对应的 public_key
      const targetAccount = accountStore.accounts.find((acc) => acc.id === importItem.account)
      return {
        ...importItem,
        account: targetAccount?.public_key || importItem.account, // 使用 public_key，如果找不到则保持原值
      }
    }) || []

    const formData: AccountForm & { origin_cluster_id?: string } = {
      name: form.name,
      description: form.description,
      status: form.status,
      is_system_account: form.is_system_account,
      origin_cluster_id: isEdit.value ? undefined : form.origin_cluster_id, // 仅创建时提交
      limits: limitsEnabled.value
        ? {
            max_connections: form.limits.max_connections,
            max_leaf_nodes: form.limits.max_leaf_nodes,
            max_data_value: form.limits.max_data_value,
            max_data_unit: form.limits.max_data_unit,
            max_payload_value: form.limits.max_payload_value,
            max_payload_unit: form.limits.max_payload_unit,
            max_subscriptions: form.limits.max_subscriptions,
            jetstream_limits: jetStreamEnabled.value
              ? {
                  enabled: true,
                  memory_storage_value: form.limits.jetstream_limits!.memory_storage_value,
                  memory_storage_unit: form.limits.jetstream_limits!.memory_storage_unit,
                  disk_storage_value: form.limits.jetstream_limits!.disk_storage_value,
                  disk_storage_unit: form.limits.jetstream_limits!.disk_storage_unit,
                  streams: form.limits.jetstream_limits!.streams,
                  consumers: form.limits.jetstream_limits!.consumers,
                  max_ack_pending: form.limits.jetstream_limits!.max_ack_pending,
                  memory_max_stream_bytes_value:
                    form.limits.jetstream_limits!.memory_max_stream_bytes_value,
                  memory_max_stream_bytes_unit:
                    form.limits.jetstream_limits!.memory_max_stream_bytes_unit,
                  disk_max_stream_bytes_value:
                    form.limits.jetstream_limits!.disk_max_stream_bytes_value,
                  disk_max_stream_bytes_unit:
                    form.limits.jetstream_limits!.disk_max_stream_bytes_unit,
                  max_bytes_required: form.limits.jetstream_limits!.max_bytes_required,
                }
              : undefined,
            imports: processedImports,
            exports: form.limits.exports || [],
          }
        : undefined,
    }

    if (isEdit.value && route.params.id) {
      await accountStore.updateAccount(route.params.id as string, formData)
    } else {
      await accountStore.createAccount(formData)
    }

    router.push('/accounts')
  } catch (error) {
    console.error('Failed to save account:', error)
  } finally {
    loading.value = false
  }
}

const loadAccount = async () => {
  if (!isEdit.value || !route.params.id) return

  try {
    const account = await accountStore.fetchAccount(route.params.id as string)

    // Populate form with account data
    form.name = account.name
    form.description = account.description
    form.status = account.status
    form.is_system_account = account.is_system_account || false

    if (account.limits) {
      limitsEnabled.value = true
      jetStreamEnabled.value = !!account.limits.jetstream_limits?.enabled
      
      // 处理 imports：将 public_key 转换为 account_id 用于表单显示
      const processedImports = account.limits.imports?.map((importItem) => {
        // 根据 public_key 查找对应的 account_id
        const targetAccount = accountStore.accounts.find(
          (acc) => acc.public_key === importItem.account
        )
        return {
          ...importItem,
          account: targetAccount?.id || importItem.account, // 使用 id 用于选择器，如果找不到则保持原值
        }
      }) || []
      
      form.limits = {
        max_connections: account.limits.max_connections,
        max_leaf_nodes: account.limits.max_leaf_nodes,
        max_data_value: account.limits.max_data_value || 1,
        max_data_unit: account.limits.max_data_unit || 'GB',
        max_payload_value: account.limits.max_payload_value || 1,
        max_payload_unit: account.limits.max_payload_unit || 'MB',
        max_subscriptions: account.limits.max_subscriptions,
        jetstream_limits: account.limits.jetstream_limits || {
          enabled: false,
          memory_storage_value: 512,
          memory_storage_unit: 'MB' as StorageUnit,
          disk_storage_value: 1,
          disk_storage_unit: 'GB' as StorageUnit,
          streams: 0,
          consumers: 0,
          max_ack_pending: 0,
          memory_max_stream_bytes_value: 128,
          memory_max_stream_bytes_unit: 'MB' as StorageUnit,
          disk_max_stream_bytes_value: 256,
          disk_max_stream_bytes_unit: 'MB' as StorageUnit,
          max_bytes_required: false,
        },
        imports: processedImports,
        exports: account.limits.exports || [],
      }
    }
  } catch (error) {
    console.error('Failed to load account:', error)
    ElMessage.error('加载账户数据失败')
    router.push('/accounts')
  }
}



onMounted(async () => {
  // 加载集群列表(用于所属集群选择)
  if (clusterStore.clusters.length === 0) {
    await clusterStore.fetchClusters()
  }

  // 加载账户列表(用于import配置)
  if (accountStore.accounts.length === 0) {
    await accountStore.fetchAccounts()
  }

  // 加载账户数据(如果是编辑模式)
  loadAccount()
})
</script>

<style scoped lang="scss">
.account-form {
  padding: 20px;
  max-width: 100%;
  margin: 0;
}

.page-header {
  margin-bottom: 8px;

  .back-button {
    margin-bottom: 2px;
    color: var(--el-color-primary);
  }

  h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 2px;
    color: var(--el-text-color-primary);
  }

  p {
    color: var(--el-text-color-regular);
    font-size: 14px;
    margin: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.limits-toggle {
  display: flex;
  align-items: center;
  gap: 12px;

  .system-account-note {
    font-size: 12px;
  }
}

.system-account-limits {
  padding: 16px 0;
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
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.readonly-field {
  display: flex;
  align-items: center;
  gap: 12px;

  .readonly-description {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}

:deep(.el-card) {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.el-col {
  margin-bottom: 20px;
}

.import-export-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .export-item,
  .import-item {
    margin-bottom: 16px;

    .export-header,
    .import-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .export-name,
      .import-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
  }
}
</style>

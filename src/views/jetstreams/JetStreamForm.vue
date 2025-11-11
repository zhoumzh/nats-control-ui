<template>
  <div class="jetstream-form">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="info" link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      <div class="header-right">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </div>

    <!-- Form -->
    <el-card shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="left"
        class="jetstream-form-content"
      >
        <!-- Basic Information -->
        <div class="form-section">
          <h3 class="section-title">{{ isEdit ? '编辑 JetStream' : '创建 JetStream' }}</h3>

          <el-form-item label="名称" prop="name" required>
            <el-input
              v-model="form.name"
              placeholder="请输入 JetStream 名称"
              :disabled="isEdit"
              @blur="validateName"
            />
            <div class="form-help">JetStream 名称必须唯一，创建后不可修改</div>
          </el-form-item>

          <div class="form-inline-row">
            <el-form-item
              label="NATS操作用户"
              prop="nats_operate_user_id"
              required
              label-width="120px"
            >
              <el-select
                v-model="form.nats_operate_user_id"
                placeholder="选择用户"
                clearable
                class="inline-select"
                :disabled="isEdit"
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="集群" prop="cluster_id" required label-width="60px">
              <el-select
                v-model="form.cluster_id"
                placeholder="选择集群"
                clearable
                class="inline-select"
                :disabled="isEdit"
              >
                <el-option
                  v-for="cluster in clusterOptions"
                  :key="cluster.id"
                  :label="cluster.name"
                  :value="cluster.id"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入描述信息"
            />
          </el-form-item>
        </div>

        <!-- Stream Configuration -->
        <div class="form-section">
          <h3 class="section-title">流配置</h3>

          <el-form-item label="Subjects" prop="subjects" required class="subjects-form-item">
            <div class="subjects-input">
              <el-tag
                v-for="(subject, index) in form.subjects"
                :key="index"
                closable
                @close="removeSubject(index)"
                class="subject-tag"
                size="large"
              >
                {{ subject }}
              </el-tag>
              <el-input
                v-if="showSubjectInput"
                ref="subjectInputRef"
                v-model="newSubject"
                @keyup.enter="addSubject"
                @blur="addSubject"
                style="width: 280px"
                placeholder="例如: events.*, logs.>"
              />
              <el-button v-else @click="showAddSubject"> + 添加 Subject </el-button>
            </div>
            <div class="form-help">支持通配符，例如: events.*, logs.>, data.user.*</div>
          </el-form-item>

          <div class="form-grid stream-config-grid">
            <el-form-item label="存储类型" prop="storage" label-width="100px">
              <el-select v-model="form.storage">
                <el-option
                  v-for="option in storageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="保留策略" prop="retention" label-width="100px">
              <el-select v-model="form.retention">
                <el-option
                  v-for="option in retentionOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="丢弃策略" prop="discard" label-width="100px">
              <el-select v-model="form.discard">
                <el-option
                  v-for="option in discardOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="压缩类型" prop="compression" label-width="100px">
              <el-select v-model="form.compression">
                <el-option
                  v-for="option in compressionOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- Limits Configuration -->
        <div class="form-section">
          <h3 class="section-title">限制配置</h3>

          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="最大消息数" prop="max_msgs" label-width="100px">
                <div class="number-input-with-unlimited">
                  <el-input-number
                    v-model="form.max_msgs"
                    :min="maxMsgsUnlimited ? -1 : 1"
                    :disabled="maxMsgsUnlimited"
                    placeholder="请输入数值"
                    style="width: 140px"
                  />
                  <el-checkbox v-model="maxMsgsUnlimited" @change="handleMaxMsgsUnlimitedChange">
                    不限
                  </el-checkbox>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="最大字节数" label-width="100px">
                <StorageInput
                  :value="form.max_bytes_value"
                  :unit="form.max_bytes_unit"
                  :allow-unlimited="true"
                  @update:value="form.max_bytes_value = $event"
                  @update:unit="form.max_bytes_unit = $event"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="消息存活时间" prop="max_age" label-width="100px">
                <div class="number-input-with-unlimited">
                  <el-input-number
                    v-model="form.max_age"
                    :min="maxAgeUnlimited ? 0 : 1"
                    :disabled="maxAgeUnlimited"
                    placeholder="请输入秒数"
                    style="width: 140px"
                  />
                  <el-checkbox v-model="maxAgeUnlimited" @change="handleMaxAgeUnlimitedChange">
                    永久
                  </el-checkbox>
                </div>
                <div class="form-help">单位：秒</div>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="最大消息大小" label-width="100px">
                <StorageInput
                  :value="form.max_msg_size_value"
                  :unit="form.max_msg_size_unit"
                  :allow-unlimited="true"
                  @update:value="form.max_msg_size_value = $event"
                  @update:unit="form.max_msg_size_unit = $event"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="最大消费者数" prop="max_consumers" label-width="100px">
                <div class="number-input-with-unlimited">
                  <el-input-number
                    v-model="form.max_consumers"
                    :min="maxConsumersUnlimited ? -1 : 1"
                    :disabled="maxConsumersUnlimited"
                    placeholder="请输入数值"
                    style="width: 140px"
                  />
                  <el-checkbox
                    v-model="maxConsumersUnlimited"
                    @change="handleMaxConsumersUnlimitedChange"
                  >
                    不限
                  </el-checkbox>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- Replica and Persistence Configuration -->
        <div class="form-section">
          <h3 class="section-title">副本和持久化配置</h3>

          <div class="form-grid">
            <el-form-item label="副本数量" prop="replicas">
              <el-input-number v-model="form.replicas" :min="1" :max="maxReplicas" />
              <div class="form-help">建议设置为奇数，最大 {{ maxReplicas }}</div>
            </el-form-item>

            <el-form-item label="重复检测窗口" prop="duplicate_window">
              <el-input-number
                v-model="form.duplicate_window"
                :min="0"
                placeholder="秒，0 表示关闭"
              />
              <div class="form-help">秒，0 表示关闭重复检测</div>
            </el-form-item>
          </div>

          <div class="switches-grid">
            <el-form-item label="禁用确认" prop="no_ack">
              <el-switch v-model="form.no_ack" />
              <span class="form-help inline">启用时消息无需确认</span>
            </el-form-item>

            <el-form-item label="允许汇总标头" prop="allow_rollup_hdrs">
              <el-switch v-model="form.allow_rollup_hdrs" />
              <span class="form-help inline">允许消息汇总操作</span>
            </el-form-item>

            <el-form-item label="允许直接访问" prop="allow_direct">
              <el-switch v-model="form.allow_direct" />
              <span class="form-help inline">允许直接消息访问</span>
            </el-form-item>

            <el-form-item label="镜像直接访问" prop="mirror_direct">
              <el-switch v-model="form.mirror_direct" />
              <span class="form-help inline">镜像支持直接访问</span>
            </el-form-item>

            <el-form-item label="禁止删除" prop="deny_delete">
              <el-switch v-model="form.deny_delete" />
              <span class="form-help inline">禁止删除消息</span>
            </el-form-item>

            <el-form-item label="禁止清除" prop="deny_purge">
              <el-switch v-model="form.deny_purge" />
              <span class="form-help inline">禁止清除所有消息</span>
            </el-form-item>
          </div>
        </div>

        <!-- Advanced Configuration -->
        <div class="form-section">
          <h3 class="section-title">高级配置 <span class="optional">(可选)</span></h3>

          <el-form-item label="放置标签" prop="placement_tags">
            <div class="tags-input">
              <el-tag
                v-for="(tag, index) in form.placement_tags"
                :key="index"
                closable
                @close="removeTag(index)"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="showTagInput"
                ref="tagInputRef"
                v-model="newTag"
                size="small"
                @keyup.enter="addTag"
                @blur="addTag"
                style="width: 150px"
                placeholder="添加标签"
              />
              <el-button v-else size="small" @click="showAddTag"> + 添加标签 </el-button>
            </div>
            <div class="form-help">用于集群节点选择的标签</div>
          </el-form-item>

          <el-form-item label="自定义元数据">
            <div class="metadata-editor">
              <div v-for="(value, key, index) in form.metadata" :key="index" class="metadata-item">
                <el-input
                  v-model="metadataKeys[index]"
                  placeholder="键"
                  @blur="updateMetadataKey(index, key as string)"
                  style="width: 200px"
                />
                <el-input
                  v-model="form.metadata![key as string]"
                  placeholder="值"
                  style="width: 200px"
                />
                <el-button type="danger" size="small" @click="removeMetadata(key as string)">
                  删除
                </el-button>
              </div>
              <el-button size="small" @click="addMetadata"> + 添加元数据 </el-button>
            </div>
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useClusterStore } from '@/stores/clusters'
import { useUserStore } from '@/stores/users'
import { clusterApi } from '@/api/clusters'
import StorageInput from '@/components/StorageInput.vue'
import type {
  JetStreamForm,
  JetStreamStorageType,
  JetStreamRetentionPolicy,
  JetStreamDiscardPolicy,
  JetStreamCompressionType,
  StorageUnit,
} from '@/types'

const route = useRoute()
const router = useRouter()
const jetStreamStore = useJetStreamStore()
const clustersStore = useClusterStore()
const usersStore = useUserStore()

// State
const formRef = ref()
const subjectInputRef = ref()
const tagInputRef = ref()
const loading = ref(false)
const showSubjectInput = ref(false)
const showTagInput = ref(false)
const newSubject = ref('')
const newTag = ref('')
const metadataKeys = ref<string[]>([])

// Unlimited checkboxes state
const maxMsgsUnlimited = ref(false)
const maxAgeUnlimited = ref(false)
const maxConsumersUnlimited = ref(false)

// Max replicas based on cluster node count
const maxReplicas = ref(5)

const isEdit = computed(() => route.name === 'JetStreamEdit')
const jetStreamId = computed(() => route.params.id as string)

// Form data
const form = reactive<JetStreamForm>({
  name: '',
  description: '',
  nats_operate_user_id: '',
  cluster_id: '',
  subjects: [],
  storage: 'file' as JetStreamStorageType,
  retention: 'limits' as JetStreamRetentionPolicy,
  discard: 'old' as JetStreamDiscardPolicy,
  compression: 'none' as JetStreamCompressionType,
  max_msgs: -1,
  max_bytes_value: 1,
  max_bytes_unit: 'GB' as StorageUnit,
  max_age: 0,
  max_msg_size_value: 1,
  max_msg_size_unit: 'MB' as StorageUnit,
  max_consumers: -1,
  replicas: 1,
  no_ack: false,
  duplicate_window: 0,
  allow_rollup_hdrs: false,
  allow_direct: false,
  mirror_direct: false,
  deny_delete: false,
  deny_purge: false,
  placement_cluster: '',
  placement_tags: [],
  metadata: {},
})

// Validation rules
const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只能包含字母、数字、下划线和连字符', trigger: 'blur' },
  ],
  nats_operate_user_id: [{ required: true, message: '请选择NATS操作用户', trigger: 'change' }],
  cluster_id: [{ required: true, message: '请选择集群', trigger: 'change' }],
  subjects: [{ required: true, message: '请至少添加一个 Subject', trigger: 'change' }],
  replicas: [
    { required: true, message: '请设置副本数量', trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      validator: (rule: any, value: number, callback: any) => {
        if (value < 1) {
          callback(new Error('副本数量至少为 1'))
        } else if (value > maxReplicas.value) {
          callback(new Error(`副本数量不能超过集群节点数 ${maxReplicas.value}`))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// Computed
const storageOptions = computed(() => jetStreamStore.getStorageTypeOptions())
const retentionOptions = computed(() => jetStreamStore.getRetentionPolicyOptions())
const discardOptions = computed(() => jetStreamStore.getDiscardPolicyOptions())
const compressionOptions = computed(() => jetStreamStore.getCompressionTypeOptions())
const clusterOptions = computed(() => clustersStore.clusters)
const userOptions = computed(() => usersStore.adminUsers)

// Watch cluster_id change to update max replicas
const fetchMaxReplicas = async () => {
  if (!form.cluster_id) {
    maxReplicas.value = 5
    return
  }

  try {
    const result = await clusterApi.getClusterNodeCount(form.cluster_id)
    maxReplicas.value = result.node_count || 5
    // If current replicas exceed max, adjust it
    if (form.replicas > maxReplicas.value) {
      form.replicas = maxReplicas.value
    }
  } catch (error) {
    console.error('Failed to fetch cluster node count:', error)
    maxReplicas.value = 5
  }
}

// Methods
const loadJetStream = async () => {
  if (!isEdit.value || !jetStreamId.value) return

  try {
    loading.value = true
    const jetstream = await jetStreamStore.fetchJetStream(jetStreamId.value)

    // Fill form with existing data
    Object.assign(form, {
      name: jetstream.name,
      description: jetstream.description,
      nats_operate_user_id: jetstream.nats_operate_user_id,
      cluster_id: jetstream.cluster_id,
      subjects: [...jetstream.subjects],
      storage: jetstream.storage,
      retention: jetstream.retention,
      discard: jetstream.discard,
      compression: jetstream.compression,
      max_msgs: jetstream.max_msgs,
      max_bytes_value: jetstream.max_bytes_value,
      max_bytes_unit: jetstream.max_bytes_unit,
      max_age: jetstream.max_age,
      max_msg_size_value: jetstream.max_msg_size_value,
      max_msg_size_unit: jetstream.max_msg_size_unit,
      max_consumers: jetstream.max_consumers,
      replicas: jetstream.replicas,
      no_ack: jetstream.no_ack,
      duplicate_window: jetstream.duplicate_window,
      allow_rollup_hdrs: jetstream.allow_rollup_hdrs,
      allow_direct: jetstream.allow_direct,
      mirror_direct: jetstream.mirror_direct,
      deny_delete: jetstream.deny_delete,
      deny_purge: jetstream.deny_purge,
      placement_cluster: jetstream.placement_cluster || '',
      placement_tags: jetstream.placement_tags ? [...jetstream.placement_tags] : [],
      metadata: jetstream.metadata ? { ...jetstream.metadata } : {},
    })

    // Initialize metadata keys
    metadataKeys.value = form.metadata ? Object.keys(form.metadata) : []

    // Initialize unlimited checkboxes based on form values
    maxMsgsUnlimited.value = jetstream.max_msgs === -1
    maxAgeUnlimited.value = jetstream.max_age === 0
    maxConsumersUnlimited.value = jetstream.max_consumers === -1
  } catch (error) {
    ElMessage.error('加载 JetStream 信息失败')
    router.push('/jetstreams')
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  try {
    await Promise.all([
      clustersStore.fetchClusters(),
      usersStore.fetchAdminUsersFromNonSystemAccounts(),
    ])
  } catch (error) {
    console.error('Failed to load options:', error)
  }
}

const handleCopyConfig = () => {
  const copyQuery = route.query.copy
  if (copyQuery && typeof copyQuery === 'string') {
    try {
      const config = JSON.parse(copyQuery)
      Object.assign(form, config)
      metadataKeys.value = form.metadata ? Object.keys(form.metadata) : []
      ElMessage.success('配置已复制')
    } catch (error) {
      console.error('Failed to parse copy config:', error)
    }
  }
}

const validateName = async () => {
  if (!form.name || !form.nats_operate_user_id) return

  try {
    const result = await jetStreamStore.validateJetStreamName(
      form.name,
      form.nats_operate_user_id,
      isEdit.value ? jetStreamId.value : undefined
    )

    if (!result.valid) {
      ElMessage.warning(result.message)
    }
  } catch (error) {
    console.error('Name validation failed:', error)
  }
}

// Handle unlimited checkboxes
const handleMaxMsgsUnlimitedChange = (checked: boolean) => {
  form.max_msgs = checked ? -1 : 1000
}

const handleMaxAgeUnlimitedChange = (checked: boolean) => {
  form.max_age = checked ? 0 : 86400 // 默认1天
}

const handleMaxConsumersUnlimitedChange = (checked: boolean) => {
  form.max_consumers = checked ? -1 : 100
}

const showAddSubject = () => {
  showSubjectInput.value = true
  nextTick(() => {
    subjectInputRef.value?.focus()
  })
}

const addSubject = () => {
  const subject = newSubject.value.trim()
  if (subject && !form.subjects.includes(subject)) {
    form.subjects.push(subject)
  }
  newSubject.value = ''
  showSubjectInput.value = false
}

const removeSubject = (index: number) => {
  form.subjects.splice(index, 1)
}

const showAddTag = () => {
  showTagInput.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && form.placement_tags && !form.placement_tags.includes(tag)) {
    form.placement_tags.push(tag)
  }
  newTag.value = ''
  showTagInput.value = false
}

const removeTag = (index: number) => {
  if (form.placement_tags) {
    form.placement_tags.splice(index, 1)
  }
}

const addMetadata = () => {
  if (!form.metadata) {
    form.metadata = {}
  }
  const key = `key${Object.keys(form.metadata).length + 1}`
  form.metadata[key] = ''
  metadataKeys.value.push(key)
}

const removeMetadata = (key: string) => {
  if (form.metadata) {
    delete form.metadata[key]
  }
  const index = metadataKeys.value.indexOf(key)
  if (index > -1) {
    metadataKeys.value.splice(index, 1)
  }
}

const updateMetadataKey = (index: number, oldKey: string) => {
  const newKey = metadataKeys.value[index]
  if (newKey !== oldKey && newKey && form.metadata) {
    const value = form.metadata[oldKey]
    delete form.metadata[oldKey]
    form.metadata[newKey] = value
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    if (form.subjects.length === 0) {
      ElMessage.error('请至少添加一个 Subject')
      return
    }

    loading.value = true

    const submitData = {
      ...form,
      placement_cluster: form.placement_cluster || undefined,
      placement_tags:
        form.placement_tags && form.placement_tags.length > 0 ? form.placement_tags : undefined,
      metadata: form.metadata && Object.keys(form.metadata).length > 0 ? form.metadata : undefined,
    }

    if (isEdit.value) {
      await jetStreamStore.updateJetStream(jetStreamId.value, submitData)
      ElMessage.success('更新成功，正在同步到 NATS Server...')
    } else {
      await jetStreamStore.createJetStream(submitData)
      ElMessage.success('创建成功，正在同步到 NATS Server...')
    }

    router.push('/jetstreams')
  } catch (error) {
    if (error !== false) {
      // Form validation error returns false
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/jetstreams')
}

// Watch for cluster_id changes (only for create mode to avoid duplicate calls)
watch(
  () => form.cluster_id,
  async (newClusterId) => {
    // Skip if in edit mode during initial load
    if (isEdit.value && loading.value) return

    if (newClusterId) {
      await fetchMaxReplicas()
    } else {
      maxReplicas.value = 5
    }
  }
)

// Lifecycle
onMounted(async () => {
  await loadOptions()

  if (isEdit.value) {
    await loadJetStream()
    // Fetch max replicas after loading jetstream data (watch won't trigger during loading)
    await fetchMaxReplicas()
  } else {
    handleCopyConfig()
  }
})
</script>

<style scoped>
.jetstream-form {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
}

.jetstream-form-content {
  max-width: 100%;
}

/* 网格布局样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* 流配置网格特殊样式 */
.stream-config-grid {
  margin-top: 32px;
}

/* Subjects 表单项特殊样式 */
.subjects-form-item {
  margin-bottom: 0;
}

/* 行内布局样式 */
.form-inline-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.form-inline-row .el-form-item {
  flex: 1;
  min-width: 0;
}

.inline-select {
  width: 100%;
}

/* 限制配置部分需要更宽的列 */
.limits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* 数字输入框带不限复选框的样式 */
.number-input-with-unlimited {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-input-with-unlimited .el-checkbox {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 开关组网格布局 */
.switches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

/* 优化表单项间距 */
:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  padding-right: 12px !important;
  font-weight: 500;
}

.form-section {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.optional {
  color: var(--el-text-color-secondary);
  font-weight: normal;
  font-size: 14px;
}

.form-help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.form-help.inline {
  margin-left: 12px;
  margin-top: 0;
}

.subjects-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.subject-tag {
  margin: 0;
  font-size: 14px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.tag-item {
  margin: 0;
}

/* 优化开关组中的表单项 */
.switches-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.switches-grid :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metadata-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 优化输入组件与label的间距 */
:deep(.el-input),
:deep(.el-select),
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-form-item__content) {
  line-height: 1.4;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .switches-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .jetstream-form {
    padding: 16px;
  }
}
</style>

<template>
  <div class="consumer-form">
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

    <el-card shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        label-position="left"
        class="consumer-form-content"
      >
        <div class="form-section">
          <h3 class="section-title">基础信息</h3>

          <div class="form-grid-3">
            <el-form-item label="集群" prop="cluster_id" required>
              <el-select
                v-model="form.cluster_id"
                placeholder="选择集群"
                clearable
                filterable
                :disabled="isEdit"
                @change="handleClusterChange"
              >
                <el-option
                  v-for="cluster in clusterOptions"
                  :key="cluster.id"
                  :label="cluster.name"
                  :value="cluster.id"
                />
              </el-select>
              <div class="form-help">选择 Stream 所在的集群</div>
            </el-form-item>

            <el-form-item label="Stream 名称" prop="stream_name" required>
              <el-select
                v-model="form.stream_name"
                placeholder="选择已存在的 Stream"
                clearable
                filterable
                :disabled="isEdit || !form.cluster_id"
                @change="handleStreamChange"
              >
                <el-option
                  v-for="stream in filteredStreamOptions"
                  :key="stream.id"
                  :label="stream.name"
                  :value="stream.name"
                />
              </el-select>
              <div class="form-help">选择集群后可用</div>
            </el-form-item>

            <el-form-item label="Consumer 名称" prop="consumer_name" required>
              <el-input
                v-model="form.consumer_name"
                placeholder="唯一的持久 Consumer 名称"
                :disabled="isEdit"
              />
              <div class="form-help">Consumer 名称（Durable）必须唯一，创建后不可修改</div>
            </el-form-item>
          </div>

          <div class="form-grid-2">
            <el-form-item label="模式" prop="mode" required>
              <el-select
                v-model="form.mode"
                placeholder="选择 Push 或 Pull 模式"
                :disabled="isEdit"
              >
                <el-option label="Push 模式" value="push">
                  <div>
                    <div>Push 模式</div>
                    <div style="font-size: 12px; color: var(--el-text-color-secondary)">
                      服务端主动推送消息
                    </div>
                  </div>
                </el-option>
                <el-option label="Pull 模式" value="pull">
                  <div>
                    <div>Pull 模式</div>
                    <div style="font-size: 12px; color: var(--el-text-color-secondary)">
                      客户端主动拉取消息
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="Ack 模式" prop="ack_policy" required>
              <el-select v-model="form.ack_policy" placeholder="选择确认策略">
                <el-option
                  v-for="option in ackPolicyOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                >
                  <div>
                    <div>{{ option.label }}</div>
                    <div style="font-size: 12px; color: var(--el-text-color-secondary)">
                      {{ option.description }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </div>
        </div>

        <div v-if="form.mode === 'push'" class="form-section">
          <h3 class="section-title">Push 模式配置</h3>

          <el-form-item label="Deliver Subject" prop="deliver_subject" required>
            <el-input
              v-model="form.deliver_subject"
              placeholder="推送的目标 subject，例如: events.push"
            />
            <div class="form-help">Push 模式必填：服务器推送消息的目标 subject</div>
          </el-form-item>

          <div class="form-grid-2">
            <el-form-item label="Queue Group" prop="deliver_group">
              <el-input v-model="form.deliver_group" placeholder="可选，用于负载均衡" />
              <div class="form-help">用于负载均衡的消费组名</div>
            </el-form-item>

            <el-form-item label="Rate Limit (Bps)" prop="rate_limit_bps">
              <el-input-number
                v-model="form.rate_limit_bps"
                :min="0"
                placeholder="每秒最大字节数"
                style="width: 100%"
              />
              <div class="form-help">每秒最大字节数，0 表示无限制</div>
            </el-form-item>
          </div>

          <div class="form-grid-2">
            <el-form-item label="启用 Flow Control" prop="flow_control">
              <el-switch v-model="form.flow_control" />
              <span class="form-help inline">启用流量控制</span>
            </el-form-item>

            <el-form-item
              v-if="form.flow_control"
              label="Idle Heartbeat"
              prop="idle_heartbeat"
              :required="form.flow_control"
            >
              <el-input v-model="form.idle_heartbeat" placeholder="例如: 5s, 100ms" />
              <div class="form-help">无消息时心跳间隔，如 '5s', '100ms'</div>
            </el-form-item>
          </div>
        </div>

        <div v-if="form.mode === 'pull'" class="form-section">
          <h3 class="section-title">Pull 模式配置</h3>

          <div class="form-grid-3">
            <el-form-item label="Max Batch" prop="max_batch">
              <el-input-number
                v-model="form.max_batch"
                :min="1"
                placeholder="一次拉取最大条数"
                style="width: 100%"
              />
              <div class="form-help">一次拉取最大条数</div>
            </el-form-item>

            <el-form-item label="Max Bytes" prop="max_bytes">
              <el-input-number
                v-model="form.max_bytes"
                :min="1"
                placeholder="一次拉取最大字节数"
                style="width: 100%"
              />
              <div class="form-help">一次拉取最大字节数</div>
            </el-form-item>

            <el-form-item label="Max Expires" prop="max_expires">
              <el-input v-model="form.max_expires" placeholder="例如: 30s, 1m" />
              <div class="form-help">一次拉取最长等待时间</div>
            </el-form-item>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">消息过滤</h3>

          <el-form-item label="Filter Mode" prop="filter_mode">
            <el-radio-group v-model="filterMode">
              <el-radio label="none">不过滤（消费整个 Stream）</el-radio>
              <el-radio label="single">单个 Subject</el-radio>
              <el-radio label="multiple">多个 Subjects</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="filterMode === 'single'" label="Filter Subject" prop="filter_subject">
            <el-select
              v-model="form.filter_subject"
              placeholder="选择要过滤的 subject"
              clearable
              filterable
              allow-create
            >
              <el-option
                v-for="subject in currentStreamSubjects"
                :key="subject"
                :label="subject"
                :value="subject"
              />
            </el-select>
            <div class="form-help">单个 subject 过滤</div>
          </el-form-item>

          <el-form-item
            v-if="filterMode === 'multiple'"
            label="Filter Subjects"
            prop="filter_subjects"
          >
            <el-select
              v-model="form.filter_subjects"
              placeholder="选择要过滤的 subjects"
              multiple
              clearable
              filterable
              allow-create
            >
              <el-option
                v-for="subject in currentStreamSubjects"
                :key="subject"
                :label="subject"
                :value="subject"
              />
            </el-select>
            <div class="form-help">多个 subject 过滤（新版本支持）</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">重试与重新投递策略</h3>

          <div class="form-grid-2">
            <el-form-item label="Max Deliver" prop="max_deliver">
              <el-input-number
                v-model="form.max_deliver"
                :min="1"
                placeholder="最大重新投递次数"
                style="width: 100%"
              />
              <div class="form-help">最大重新投递次数（不设置则无限）</div>
            </el-form-item>

            <el-form-item label="Ack Wait" prop="ack_wait">
              <el-input v-model="form.ack_wait" placeholder="例如: 30s, 1m" />
              <div class="form-help">Ack 超时时间，超过则重新投递</div>
            </el-form-item>
          </div>

          <el-form-item label="Retry Policy" prop="retry_policy">
            <el-select v-model="form.retry_policy" placeholder="选择重试类型" clearable>
              <el-option label="Exponential (指数退避)" value="exponential" />
              <el-option label="Uniform (均匀退避)" value="uniform" />
            </el-select>
            <div class="form-help">重试类型：指数退避或均匀退避</div>
          </el-form-item>

          <el-form-item label="Backoff 时间数组" prop="backoff">
            <el-select
              v-model="form.backoff"
              placeholder="添加退避时间，如: 100ms, 1s, 5s"
              multiple
              allow-create
              filterable
              clearable
            >
              <el-option label="100ms" value="100ms" />
              <el-option label="1s" value="1s" />
              <el-option label="5s" value="5s" />
              <el-option label="10s" value="10s" />
              <el-option label="30s" value="30s" />
            </el-select>
            <div class="form-help">
              退避时间策略数组，例如 [100ms, 1s, 5s]，将覆盖普通固定延时策略
            </div>
          </el-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">投递策略（Deliver Policy）</h3>

          <el-form-item label="Deliver Policy" prop="deliver_policy">
            <el-select v-model="form.deliver_policy" placeholder="选择投递策略">
              <el-option
                v-for="option in deliverPolicyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              >
                <div>
                  <div>{{ option.label }}</div>
                  <div style="font-size: 12px; color: var(--el-text-color-secondary)">
                    {{ option.description }}
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item
            v-if="form.deliver_policy === 'by_start_sequence'"
            label="Start Sequence"
            prop="start_seq"
            required
          >
            <el-input-number
              v-model="form.start_seq"
              :min="1"
              placeholder="起始序列号"
              style="width: 100%"
            />
            <div class="form-help">从指定序列号开始投递消息</div>
          </el-form-item>

          <el-form-item
            v-if="form.deliver_policy === 'by_start_time'"
            label="Start Time"
            prop="start_time"
            required
          >
            <el-date-picker
              v-model="form.start_time"
              type="datetime"
              placeholder="选择起始时间"
              style="width: 100%"
              value-format="YYYY-MM-DDTHH:mm:ss.000Z"
            />
            <div class="form-help">从指定时间开始投递消息</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <h3 class="section-title">高级设置 <span class="optional">(可选)</span></h3>

          <div class="form-grid-3">
            <el-form-item label="Sample Frequency" prop="sample_freq">
              <el-input v-model="form.sample_freq" placeholder="例如: 100" />
              <div class="form-help">监控采样频率，如 '100' 表示每 100 条</div>
            </el-form-item>

            <el-form-item label="Replicas" prop="replicas">
              <el-input-number
                v-model="form.replicas"
                :min="1"
                placeholder="副本数"
                style="width: 100%"
              />
              <div class="form-help">副本数（集群模式），建议设置为奇数</div>
            </el-form-item>
          </div>

          <el-form-item label="Metadata" prop="metadata">
            <div class="metadata-container">
              <div v-for="(_, key, index) in form.metadata" :key="index" class="metadata-row">
                <el-input
                  :model-value="key"
                  placeholder="Key"
                  @input="(val: string) => handleMetadataKeyChange(key, val)"
                  style="width: 200px"
                />
                <el-input v-model="form.metadata![key]" placeholder="Value" style="flex: 1" />
                <el-button type="danger" :icon="Delete" @click="deleteMetadata(key)" circle />
              </div>
              <el-button @click="addMetadata" :icon="Plus">添加标签</el-button>
            </div>
            <div class="form-help">自定义元数据标签，便于管理</div>
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Delete, Plus } from '@element-plus/icons-vue'
import { useConsumerStore } from '@/stores/consumers'
import { useJetStreamStore } from '@/stores/jetstreams'
import { useClusterStore } from '@/stores/clusters'
import type { FormInstance, FormRules } from 'element-plus'

const route = useRoute()
const router = useRouter()
const consumerStore = useConsumerStore()
const jetstreamStore = useJetStreamStore()
const clusterStore = useClusterStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const filterMode = ref<'none' | 'single' | 'multiple'>('none')

const isEdit = computed(() => route.name === 'ConsumerEdit')
const consumerId = computed(() => route.params.id as string)

interface ConsumerFormData {
  cluster_id: string
  stream_name: string
  consumer_name: string
  mode: 'push' | 'pull'
  ack_policy: 'AckNone' | 'AckExplicit' | 'AckAll'

  deliver_subject?: string
  deliver_group?: string
  rate_limit_bps?: number
  flow_control?: boolean
  idle_heartbeat?: string

  max_batch?: number
  max_bytes?: number
  max_expires?: string

  filter_subject?: string
  filter_subjects?: string[]

  max_deliver?: number
  ack_wait?: string
  backoff?: string[]
  retry_policy?: 'exponential' | 'uniform'

  deliver_policy:
    | 'all'
    | 'new'
    | 'last'
    | 'last_per_subject'
    | 'by_start_sequence'
    | 'by_start_time'
  start_seq?: number
  start_time?: string

  sample_freq?: string
  metadata?: Record<string, string>
  replicas?: number
}

const form = reactive<ConsumerFormData>({
  cluster_id: '',
  stream_name: '',
  consumer_name: '',
  mode: 'pull',
  ack_policy: 'AckExplicit',
  deliver_policy: 'all',
  flow_control: false,
  metadata: {},
  replicas: 1,
})

const streamOptions = computed(() => jetstreamStore.jetstreams)
const clusterOptions = computed(() => clusterStore.clusters)
const filteredStreamOptions = computed(() => {
  if (!form.cluster_id) return []
  return streamOptions.value.filter((s) => s.cluster_id === form.cluster_id)
})
const currentStreamSubjects = computed(() => {
  if (!form.cluster_id || !form.stream_name) return []
  const stream = streamOptions.value.find(
    (s) => s.cluster_id === form.cluster_id && s.name === form.stream_name
  )
  return stream?.subjects || []
})

const getClusterName = (clusterId: string): string => {
  const cluster = clusterStore.clusters.find((c) => c.id === clusterId)
  return cluster?.name || '未知集群'
}

const ackPolicyOptions = [
  {
    value: 'AckNone',
    label: 'AckNone',
    description: '不需要确认',
  },
  {
    value: 'AckExplicit',
    label: 'AckExplicit',
    description: '显式确认每条消息',
  },
  {
    value: 'AckAll',
    label: 'AckAll',
    description: '确认当前消息及之前所有消息',
  },
]

const deliverPolicyOptions = [
  { value: 'all', label: 'All', description: '从 Stream 起始消息投递' },
  { value: 'new', label: 'New', description: '仅新消息' },
  { value: 'last', label: 'Last', description: '从最后一条消息开始' },
  { value: 'last_per_subject', label: 'Last Per Subject', description: '每个 subject 的最后一条' },
  { value: 'by_start_sequence', label: 'By Start Sequence', description: '从指定序号开始' },
  { value: 'by_start_time', label: 'By Start Time', description: '从指定时间开始' },
]

const rules = computed<FormRules<ConsumerFormData>>(() => {
  const baseRules: FormRules<ConsumerFormData> = {
    cluster_id: [{ required: true, message: '请选择集群', trigger: 'change' }],
    stream_name: [{ required: true, message: '请选择 Stream', trigger: 'change' }],
    consumer_name: [
      { required: true, message: '请输入 Consumer 名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    ],
    mode: [{ required: true, message: '请选择模式', trigger: 'change' }],
    ack_policy: [{ required: true, message: '请选择 Ack 策略', trigger: 'change' }],
    deliver_policy: [{ required: true, message: '请选择投递策略', trigger: 'change' }],
  }

  if (form.mode === 'push') {
    baseRules.deliver_subject = [
      { required: true, message: '请输入 Deliver Subject', trigger: 'blur' },
    ]
    if (form.flow_control) {
      baseRules.idle_heartbeat = [
        { required: true, message: '启用 Flow Control 时必须设置 Idle Heartbeat', trigger: 'blur' },
      ]
    }
  }

  if (form.deliver_policy === 'by_start_sequence') {
    baseRules.start_seq = [
      { required: true, message: '请输入起始序列号', trigger: 'blur' },
      { type: 'number', min: 1, message: '序列号至少为 1', trigger: 'blur' },
    ]
  }

  if (form.deliver_policy === 'by_start_time') {
    baseRules.start_time = [{ required: true, message: '请选择起始时间', trigger: 'change' }]
  }

  return baseRules
})

watch(
  () => form.mode,
  (newMode) => {
    if (newMode === 'pull') {
      form.deliver_subject = undefined
      form.deliver_group = undefined
      form.rate_limit_bps = undefined
      form.flow_control = false
      form.idle_heartbeat = undefined
    } else if (newMode === 'push') {
      form.max_batch = undefined
      form.max_bytes = undefined
      form.max_expires = undefined
    }
  }
)

watch(filterMode, (newMode) => {
  if (newMode === 'none') {
    form.filter_subject = undefined
    form.filter_subjects = undefined
  } else if (newMode === 'single') {
    form.filter_subjects = undefined
  } else if (newMode === 'multiple') {
    form.filter_subject = undefined
  }
})

watch(
  () => form.deliver_policy,
  (newPolicy) => {
    if (newPolicy !== 'by_start_sequence') {
      form.start_seq = undefined
    }
    if (newPolicy !== 'by_start_time') {
      form.start_time = undefined
    }
  }
)

watch(
  () => form.flow_control,
  (enabled) => {
    if (!enabled) {
      form.idle_heartbeat = undefined
    }
  }
)

const handleClusterChange = () => {
  // 清空 Stream 相关选择
  form.stream_name = ''
  filterMode.value = 'none'
  form.filter_subject = undefined
  form.filter_subjects = undefined
}

const handleStreamChange = () => {
  filterMode.value = 'none'
  form.filter_subject = undefined
  form.filter_subjects = undefined
}

const addMetadata = () => {
  if (!form.metadata) {
    form.metadata = {}
  }
  const newKey = `key_${Object.keys(form.metadata).length + 1}`
  form.metadata[newKey] = ''
}

const deleteMetadata = (key: string) => {
  if (form.metadata) {
    delete form.metadata[key]
  }
}

const handleMetadataKeyChange = (oldKey: string, newKey: string) => {
  if (oldKey === newKey || !form.metadata) return

  if (form.metadata[newKey] !== undefined) {
    ElMessage.warning('该键已存在')
    return
  }

  const value = form.metadata[oldKey]
  delete form.metadata[oldKey]
  form.metadata[newKey] = value
}

const validateForm = (): boolean => {
  if (form.mode === 'push') {
    if (!form.deliver_subject) {
      ElMessage.error('Push 模式下必须设置 deliver_subject')
      return false
    }
    if (form.max_batch || form.max_bytes || form.max_expires) {
      ElMessage.error('Push 模式下不能设置 Pull 模式特有参数（max_batch, max_bytes, max_expires）')
      return false
    }
  }

  if (form.mode === 'pull') {
    if (
      form.deliver_subject ||
      form.deliver_group ||
      form.rate_limit_bps ||
      form.flow_control ||
      form.idle_heartbeat
    ) {
      ElMessage.error(
        'Pull 模式下不能设置 Push 模式特有参数（deliver_subject, deliver_group, rate_limit_bps, flow_control, idle_heartbeat）'
      )
      return false
    }
  }

  if (form.flow_control && form.mode === 'push' && !form.idle_heartbeat) {
    ElMessage.error('启用 Flow Control 时必须设置 idle_heartbeat')
    return false
  }

  if (form.deliver_policy === 'by_start_sequence' && !form.start_seq) {
    ElMessage.error('选择 by_start_sequence 策略时必须设置 start_seq')
    return false
  }

  if (form.deliver_policy === 'by_start_time' && !form.start_time) {
    ElMessage.error('选择 by_start_time 策略时必须设置 start_time')
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (!validateForm()) {
      return
    }

    loading.value = true

    // 将表单数据转换为后端期望的格式
    // 根据规范，提交时使用 cluster_id 和 stream_name，不再使用 jetstream_id
    const submitData: any = {
      consumer_name: form.consumer_name, // 后端必需字段
      stream_name: form.stream_name, // 后端必需字段
      mode: form.mode, // 后端必需字段：'push' or 'pull'
      cluster_id: form.cluster_id, // 使用 cluster_id 替代 jetstream_id
      description: '', // TODO: 表单中没有 description 字段，先使用空字符串

      // Consumer configuration
      durable: form.consumer_name, // Durable name
      ack_policy: mapAckPolicyToBackend(form.ack_policy),
      ack_wait: form.ack_wait || '30s', // 字符串格式，如 '30s'
      max_deliver: form.max_deliver || -1, // -1 表示无限
      filter_subject: form.filter_subject,
      replay_policy: 'instant', // 默认立即重放
      sample_freq: form.sample_freq,

      // Flow control
      rate_limit: form.rate_limit_bps || 0,
      max_ack_pending: 1000, // 默认值
      max_waiting: form.mode === 'pull' ? 512 : undefined, // max_waiting 仅适用于 Pull 模式
      max_batch: form.mode === 'pull' ? form.max_batch || 0 : undefined, // max_batch 仅适用于 Pull 模式
      max_expires: form.mode === 'pull' ? form.max_expires || '0s' : undefined, // max_expires 仅适用于 Pull 模式

      // Advanced options
      inactive_threshold: 0, // 默认值
      deliver_policy: form.deliver_policy,
      opt_start_seq: form.start_seq,
      opt_start_time: form.start_time,
      deliver_subject: form.deliver_subject,
      deliver_group: form.deliver_group,
      flow_control: form.flow_control || false,
      idle_heartbeat: form.mode === 'push' ? form.idle_heartbeat || '0s' : undefined,
      headers_only: false, // 默认值
      max_request_batch: form.mode === 'pull' ? form.max_batch || 0 : undefined, // max_request_batch 仅适用于 Pull 模式
      max_request_expires: form.mode === 'pull' ? form.max_expires || '0s' : undefined, // max_request_expires 仅适用于 Pull 模式
      max_request_max_bytes: form.mode === 'pull' ? form.max_bytes || 0 : undefined, // max_request_max_bytes 仅适用于 Pull 模式

      // Memory storage
      mem_storage: false, // 默认值
      replicas: form.replicas || 1,
    }

    // 清理未定义的字段
    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === undefined) {
        delete submitData[key]
      }
    })

    if (isEdit.value) {
      await consumerStore.updateConsumer(consumerId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await consumerStore.createConsumer(submitData)
      ElMessage.success('创建成功')
    }

    router.push('/consumers')
  } catch (error: any) {
    if (error !== false) {
      const errorMessage =
        error.response?.data?.error || error.message || (isEdit.value ? '更新失败' : '创建失败')
      ElMessage.error(errorMessage)
    }
  } finally {
    loading.value = false
  }
}

// 映射表单 ack_policy 到后端值
const mapAckPolicyToBackend = (formValue: string): string => {
  switch (formValue) {
    case 'AckNone':
      return 'none'
    case 'AckAll':
      return 'all'
    case 'AckExplicit':
    default:
      return 'explicit'
  }
}

const loadConsumer = async () => {
  if (!isEdit.value || !consumerId.value) return

  try {
    loading.value = true
    const consumer = await consumerStore.fetchConsumer(consumerId.value)

    // 手动映射后端字段到表单字段
    // 查找对应的 JetStream 来获取 stream_name 和 cluster_id
    const jetstream = jetstreamStore.jetstreams.find((j) => j.id === consumer.jetstream_id)

    form.cluster_id = jetstream?.cluster_id || ''
    form.stream_name = jetstream?.name || ''
    form.consumer_name = consumer.durable || consumer.name
    form.mode = consumer.consumer_type === 'push' ? 'push' : 'pull'
    form.ack_policy = mapAckPolicyFromBackend(consumer.ack_policy)

    // Push 模式字段
    if (consumer.consumer_type === 'push') {
      form.deliver_subject = consumer.deliver_subject
      form.deliver_group = consumer.deliver_group
      form.rate_limit_bps = consumer.rate_limit > 0 ? consumer.rate_limit : undefined
      form.flow_control = consumer.flow_control
      // idle_heartbeat 后端返回的是秒数，需要转换为字符串格式（如 '5s'）
      // 只有在 flow_control 启用且值大于 0 时才设置
      if (consumer.flow_control && consumer.idle_heartbeat && consumer.idle_heartbeat > 0) {
        // 后端已经返回秒数，直接格式化为字符串
        form.idle_heartbeat = `${consumer.idle_heartbeat}s`
      }
    }

    // Pull 模式字段
    if (consumer.consumer_type === 'pull') {
      form.max_batch = consumer.max_batch > 0 ? consumer.max_batch : undefined
      form.max_bytes =
        consumer.max_request_max_bytes > 0 ? consumer.max_request_max_bytes : undefined
      form.max_expires =
        consumer.max_expires > 0 ? `${consumer.max_expires / 1000000000}s` : undefined
    }

    // 过滤器字段
    form.filter_subject = consumer.filter_subject
    if (consumer.filter_subject) {
      filterMode.value = 'single'
    } else {
      filterMode.value = 'none'
    }

    // 重试与重新投递策略
    form.max_deliver = consumer.max_deliver > 0 ? consumer.max_deliver : undefined
    form.ack_wait = consumer.ack_wait > 0 ? `${consumer.ack_wait}s` : undefined

    // 投递策略
    form.deliver_policy = mapDeliverPolicyFromBackend(consumer.deliver_policy)
    if (consumer.deliver_policy === 'by_start_sequence') {
      form.start_seq = consumer.opt_start_seq
    }
    if (consumer.deliver_policy === 'by_start_time') {
      form.start_time = consumer.opt_start_time
    }

    // 高级设置
    form.sample_freq = consumer.sample_freq
    form.replicas = consumer.replicas || 1
    form.metadata = {} // Consumer 类型中没有 metadata，使用空对象
  } catch (error) {
    ElMessage.error('加载 Consumer 信息失败')
    await router.push('/consumers')
  } finally {
    loading.value = false
  }
}

// 映射后端 ack_policy 到表单值
const mapAckPolicyFromBackend = (backendValue: string): 'AckNone' | 'AckExplicit' | 'AckAll' => {
  switch (backendValue.toLowerCase()) {
    case 'none':
      return 'AckNone'
    case 'all':
      return 'AckAll'
    case 'explicit':
    default:
      return 'AckExplicit'
  }
}

// 映射后端 deliver_policy 到表单值
const mapDeliverPolicyFromBackend = (backendValue: string): ConsumerFormData['deliver_policy'] => {
  switch (backendValue.toLowerCase()) {
    case 'all':
      return 'all'
    case 'last':
      return 'last'
    case 'new':
      return 'new'
    case 'last_per_subject':
      return 'last_per_subject'
    case 'by_start_sequence':
      return 'by_start_sequence'
    case 'by_start_time':
      return 'by_start_time'
    default:
      return 'all'
  }
}

const loadOptions = async () => {
  try {
    await Promise.all([jetstreamStore.fetchJetStreams(), clusterStore.fetchClusters()])
  } catch (error) {
    console.error('Failed to load options:', error)
  }
}

const goBack = () => {
  router.push('/consumers')
}

onMounted(async () => {
  await loadOptions()

  if (isEdit.value) {
    await loadConsumer()
  }
})
</script>

<style scoped>
.consumer-form {
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

.consumer-form-content {
  max-width: 100%;
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
  margin: 0 0 24px 0;
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
  line-height: 1.5;
}

.form-help.inline {
  margin-left: 12px;
  margin-top: 0;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.metadata-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

@media (max-width: 1200px) {
  .form-grid-2,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .consumer-form {
    padding: 16px;
  }
}
</style>

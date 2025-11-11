<template>
  <div class="cluster-form">
    <div class="header">
      <div class="title">
        <p>{{ isEdit ? '修改集群配置信息' : '创建新的NATS集群' }}</p>
      </div>
      <div class="actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="clusterStore.loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" size="default">
      <el-card :title="isEdit ? '编辑集群' : '创建集群'">
        <el-form-item label="集群名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入集群名称" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入集群描述"
          />
        </el-form-item>

        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="active">活跃</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-card>

      <el-card title="NATS配置" style="margin-top: 20px">
        <el-form-item label="主机地址" prop="host">
          <el-input
            v-model="form.host"
            placeholder="请输入主机地址，如: localhost 或 192.168.1.100"
          />
          <div class="form-tip">NATS服务器的主机地址或IP，不包含端口号</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="NATS端口" prop="nats_port">
              <el-input-number
                v-model="form.nats_port"
                :min="1"
                :max="65535"
                placeholder="4222"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="网关端口" prop="gateway_port">
              <el-input-number
                v-model="form.gateway_port"
                :min="1"
                :max="65535"
                placeholder="7222"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="监控端口" prop="monitor_port">
              <el-input-number
                v-model="form.monitor_port"
                :min="1"
                :max="65535"
                placeholder="8222"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="集群端口" prop="cluster_port">
              <el-input-number
                v-model="form.cluster_port"
                :min="1"
                :max="65535"
                placeholder="6222"
                style="width: 100%"
                :controls="false"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="系统账户" prop="system_account_id">
          <el-select
            v-model="form.system_account_id"
            placeholder="请选择系统账户"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="account in accounts"
              :key="account.id"
              :label="account.name"
              :value="account.id"
            />
          </el-select>
          <div class="form-tip">选择用于集群管理的系统账户</div>
        </el-form-item>

        <el-form-item label="系统用户" prop="system_user_id">
          <el-select
            v-model="form.system_user_id"
            placeholder="请选择系统用户"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in filteredUsers"
              :key="user.id"
              :label="`${user.name} (${user.account_id})`"
              :value="user.id"
            />
          </el-select>
          <div class="form-tip">选择用于集群管理的系统用户</div>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { useClusterStore } from '@/stores/clusters'
import { useAccountStore } from '@/stores/accounts'
import { useUserStore } from '@/stores/users'
import type { ClusterForm, ClusterStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const clusterStore = useClusterStore()
const accountStore = useAccountStore()
const userStore = useUserStore()

const formRef = ref<InstanceType<typeof ElForm>>()
const isEdit = computed(() => !!route.params.id)

const form = reactive<ClusterForm>({
  name: '',
  description: '',
  status: 'active' as ClusterStatus,
  host: '',
  nats_port: 0, // 0表示使用服务端默认值
  gateway_port: 0, // 0表示使用服务端默认值
  monitor_port: 0, // 0表示使用服务端默认值
  cluster_port: 0, // 0表示使用服务端默认值
  system_account_id: '',
  system_user_id: '',
})

const rules = {
  name: [
    { required: true, message: '请输入集群名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' },
    {
      pattern:
        /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$|^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$/,
      message: '请输入有效的主机地址或IP',
      trigger: 'blur',
    },
  ],
  nats_port: [
    { required: true, message: '请输入NATS端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围: 1-65535', trigger: 'blur' },
  ],
  gateway_port: [
    { required: true, message: '请输入网关端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围: 1-65535', trigger: 'blur' },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (value === form.nats_port) {
          callback(new Error('网关端口不能与NATS端口相同'))
        } else if (value === form.monitor_port) {
          callback(new Error('网关端口不能与监控端口相同'))
        } else if (value === form.cluster_port) {
          callback(new Error('网关端口不能与集群端口相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  monitor_port: [
    { required: true, message: '请输入监控端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围: 1-65535', trigger: 'blur' },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (value === form.nats_port) {
          callback(new Error('监控端口不能与NATS端口相同'))
        } else if (value === form.gateway_port) {
          callback(new Error('监控端口不能与网关端口相同'))
        } else if (value === form.cluster_port) {
          callback(new Error('监控端口不能与集群端口相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  cluster_port: [
    { required: true, message: '请输入集群端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围: 1-65535', trigger: 'blur' },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (value === form.nats_port) {
          callback(new Error('集群端口不能与NATS端口相同'))
        } else if (value === form.gateway_port) {
          callback(new Error('集群端口不能与网关端口相同'))
        } else if (value === form.monitor_port) {
          callback(new Error('集群端口不能与监控端口相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const accounts = computed(() => accountStore.accounts || [])
const users = computed(() => userStore.users || [])

// Filter users based on selected system account
const filteredUsers = computed(() => {
  if (!form.system_account_id) {
    return users.value
  }
  return users.value.filter((user) => user.account_id === form.system_account_id)
})

onMounted(async () => {
  // Load accounts and users for selection
  await Promise.all([accountStore.fetchAccounts(), userStore.fetchUsers()])

  if (isEdit.value) {
    await loadCluster()
  }
})

const loadCluster = async () => {
  try {
    const cluster = await clusterStore.fetchCluster(route.params.id as string)
    form.name = cluster.name
    form.description = cluster.description
    form.status = cluster.status

    // 直接使用服务端返回的值（包含默认值）
    form.host = cluster.host || ''
    form.nats_port = cluster.nats_port || 0
    form.gateway_port = cluster.gateway_port || 0
    form.monitor_port = cluster.monitor_port || 0
    form.cluster_port = cluster.cluster_port || 0
    form.system_account_id = cluster.system_account_id || ''
    form.system_user_id = cluster.system_user_id || ''
  } catch (error) {
    ElMessage.error('加载集群信息失败')
    router.back()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 准备提交数据，让服务端处理默认值
    const submitData = {
      name: form.name,
      description: form.description,
      host: form.host,
      nats_port: form.nats_port || 0, // 0让服务端应用默认值
      gateway_port: form.gateway_port || 0, // 0让服务端应用默认值
      monitor_port: form.monitor_port || 0, // 0让服务端应用默认值
      cluster_port: form.cluster_port || 0, // 0让服务端应用默认值
      system_account_id: form.system_account_id || undefined,
      system_user_id: form.system_user_id || undefined,
    }

    if (isEdit.value) {
      await clusterStore.updateCluster(route.params.id as string, {
        ...submitData,
        status: form.status,
      })
    } else {
      await clusterStore.createCluster(submitData)
    }

    router.push('/clusters')
  } catch (error) {
    console.error('Submit failed:', error)
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.cluster-form {
  padding: 20px;
  max-width: 100%;
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
}

.title p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

:deep(.el-card__header) {
  font-weight: 600;
}

:deep(.el-input-number) {
  .el-input__inner {
    text-align: left;
    min-width: 80px;
    padding-left: 12px;
    padding-right: 12px;
  }
}

:deep(.el-input-number .el-input__inner) {
  text-align: left !important;
}
</style>

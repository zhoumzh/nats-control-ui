<template>
  <el-dialog
    v-model="dialogVisible"
    title="数据共享配置"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" class="sharing-tabs">
      <!-- 导出配置 -->
      <el-tab-pane label="导出配置" name="exports">
        <div class="tab-header">
          <p class="tab-description">
            配置可供其他账户导入的 subject，允许数据共享。
          </p>
          <el-button type="primary" size="small" @click="showAddExportDialog">
            <el-icon><Plus /></el-icon>
            添加导出
          </el-button>
        </div>

        <el-table :data="exports" stripe border style="margin-top: 16px">
          <el-table-column prop="name" label="导出名称" width="150" />
          <el-table-column prop="subject" label="Subject" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'stream' ? 'success' : 'primary'" size="small">
                {{ row.type === 'stream' ? '流数据' : '服务' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="token_req" label="需要令牌" width="100">
            <template #default="{ row }">
              <el-tag :type="row.token_req ? 'warning' : 'info'" size="small">
                {{ row.token_req ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="info.description" label="说明" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                text
                size="small"
                @click="removeExport(row.name)"
                :loading="removing"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!exports || exports.length === 0" description="暂无导出配置" />
      </el-tab-pane>

      <!-- 导入配置 -->
      <el-tab-pane label="导入配置" name="imports">
        <div class="tab-header">
          <p class="tab-description">
            从其他账户导入 subject，使用其共享的数据。
          </p>
          <el-button type="primary" size="small" @click="showAddImportDialog">
            <el-icon><Plus /></el-icon>
            添加导入
          </el-button>
        </div>

        <el-table :data="imports" stripe border style="margin-top: 16px">
          <el-table-column prop="name" label="导入名称" width="150" />
          <el-table-column prop="account" label="源账户ID" width="180" show-overflow-tooltip />
          <el-table-column prop="subject" label="源Subject" width="150" />
          <el-table-column prop="to" label="本地Subject" width="150" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'stream' ? 'success' : 'primary'" size="small">
                {{ row.type === 'stream' ? '流数据' : '服务' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                text
                size="small"
                @click="removeImport(row.name)"
                :loading="removing"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!imports || imports.length === 0" description="暂无导入配置" />
      </el-tab-pane>

      <!-- 快捷关联 -->
      <el-tab-pane label="快捷关联" name="association">
        <div class="tab-header">
          <p class="tab-description">
            将当前账户的 subject 导出给目标账户使用，目标账户会自动创建对应的导入配置。
          </p>
        </div>

        <el-form
          ref="associationFormRef"
          :model="associationForm"
          :rules="associationRules"
          label-width="120px"
          class="association-form"
        >
          <el-form-item label="目标账户" prop="target_account_id">
            <el-select
              v-model="associationForm.target_account_id"
              placeholder="选择要接收导出的目标账户"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="acc in availableAccounts"
                :key="acc.id"
                :label="`${acc.name} (${acc.id})`"
                :value="acc.id"
              />
            </el-select>
            <div style="margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary);">
              当前账户将导出配置的 subject，目标账户将自动创建导入配置
            </div>
          </el-form-item>

          <el-form-item label="关联说明" prop="description">
            <el-input
              v-model="associationForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入关联说明"
            />
          </el-form-item>

          <el-divider content-position="left">要导出的 Subjects</el-divider>

          <div
            v-for="(subject, index) in associationForm.subjects"
            :key="index"
            class="subject-item"
          >
            <el-form-item
              :label="`Subject ${index + 1}`"
              :prop="`subjects.${index}.subject`"
              :rules="[{ required: true, message: '请输入 subject', trigger: 'blur' }]"
            >
              <div class="subject-row">
                <el-input
                  v-model="subject.subject"
                  placeholder="例如: orders.* 或 events.>"
                  style="flex: 1"
                />
                <el-select
                  v-model="subject.type"
                  placeholder="类型"
                  style="width: 120px; margin-left: 8px"
                >
                  <el-option label="流数据" value="stream" />
                  <el-option label="服务" value="service" />
                </el-select>
                <el-input
                  v-model="subject.description"
                  placeholder="说明（可选）"
                  style="width: 200px; margin-left: 8px"
                />
                <el-button
                  type="danger"
                  text
                  @click="removeSubject(index)"
                  style="margin-left: 8px"
                  :disabled="associationForm.subjects.length === 1"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </el-form-item>
          </div>

          <el-form-item>
            <div style="display: flex; gap: 12px; align-items: center;">
              <el-button type="primary" text @click="addSubject">
                <el-icon><Plus /></el-icon>
                添加 Subject
              </el-button>
              <el-divider direction="vertical" />
              <el-button type="primary" @click="createAssociation" :loading="submitting">
                创建导出关联
              </el-button>
              <el-button @click="resetAssociationForm">重置</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="添加导出配置"
      width="600px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="exportFormRef"
        :model="exportForm"
        :rules="exportRules"
        label-width="140px"
      >
        <el-form-item label="导出名称" prop="name">
          <el-input v-model="exportForm.name" placeholder="例如: order-events" />
        </el-form-item>

        <el-form-item label="Subject" prop="subject">
          <el-input v-model="exportForm.subject" placeholder="例如: orders.*" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="exportForm.type">
            <el-radio value="stream">流数据</el-radio>
            <el-radio value="service">服务</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="说明">
          <el-input
            v-model="exportForm.description"
            type="textarea"
            :rows="2"
            placeholder="导出说明（可选）"
          />
        </el-form-item>

        <el-form-item label="需要激活令牌">
          <el-switch v-model="exportForm.token_req" />
          <span style="margin-left: 8px; color: var(--el-text-color-secondary); font-size: 12px">
            启用后，导入此配置需要提供激活令牌
          </span>
        </el-form-item>

        <el-form-item label="信息URL">
          <el-input v-model="exportForm.info_url" placeholder="更多信息的URL（可选）" />
        </el-form-item>

        <el-form-item
          v-if="exportForm.type === 'service'"
          label="响应类型"
        >
          <el-input v-model="exportForm.response_type" placeholder="响应类型（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addExport" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="添加导入配置"
      width="600px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="importFormRef"
        :model="importForm"
        :rules="importRules"
        label-width="140px"
      >
        <el-form-item label="导入名称" prop="name">
          <el-input v-model="importForm.name" placeholder="例如: imported-orders" />
        </el-form-item>

        <el-form-item label="源账户" prop="account">
          <el-select
            v-model="importForm.account"
            placeholder="选择源账户"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="acc in availableAccounts"
              :key="acc.id"
              :label="`${acc.name} (${acc.id})`"
              :value="acc.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="源 Subject" prop="subject">
          <el-input v-model="importForm.subject" placeholder="例如: orders.*" />
        </el-form-item>

        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="importForm.type">
            <el-radio value="stream">流数据</el-radio>
            <el-radio value="service">服务</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="本地 Subject">
          <el-input
            v-model="importForm.to"
            placeholder="本地映射 subject（可选，不填则使用原 subject）"
          />
        </el-form-item>

        <el-form-item label="激活令牌">
          <el-input
            v-model="importForm.token"
            placeholder="如果源账户要求令牌，请输入"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addImport" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { accountApi } from '@/api/accounts'
import { useAccountStore } from '@/stores/accounts'
import type { Account, Export, Import } from '@/types'
import { Plus, Delete } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  accountId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const accountStore = useAccountStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref('exports')
const account = ref<Account | null>(null)
const removing = ref(false)
const submitting = ref(false)

// 导出配置
const exportDialogVisible = ref(false)
const exportFormRef = ref<FormInstance>()
const exportForm = ref({
  name: '',
  subject: '',
  type: 'stream' as 'stream' | 'service',
  description: '',
  token_req: false,
  info_url: '',
  response_type: '',
})

const exportRules: FormRules = {
  name: [{ required: true, message: '请输入导出名称', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入 subject', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

// 导入配置
const importDialogVisible = ref(false)
const importFormRef = ref<FormInstance>()
const importForm = ref({
  name: '',
  account: '',
  subject: '',
  type: 'stream' as 'stream' | 'service',
  to: '',
  token: '',
})

const importRules: FormRules = {
  name: [{ required: true, message: '请输入导入名称', trigger: 'blur' }],
  account: [{ required: true, message: '请选择源账户', trigger: 'change' }],
  subject: [{ required: true, message: '请输入源 subject', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

// 快捷关联
const associationFormRef = ref<FormInstance>()
const associationForm = ref({
  target_account_id: '',
  description: '',
  subjects: [
    {
      subject: '',
      type: 'stream' as 'stream' | 'service',
      description: '',
    },
  ],
})

const associationRules: FormRules = {
  target_account_id: [{ required: true, message: '请选择目标账户', trigger: 'change' }],
}

const exports = computed(() => account.value?.limits?.exports || [])
const imports = computed(() => account.value?.limits?.imports || [])

const availableAccounts = computed(() => {
  return accountStore.accounts.filter((acc) => acc.id !== props.accountId)
})

const loadAccount = async () => {
  try {
    account.value = await accountApi.getAccount(props.accountId)
  } catch (error) {
    console.error('加载账户信息失败:', error)
    ElMessage.error('加载账户信息失败')
  }
}

const showAddExportDialog = () => {
  exportForm.value = {
    name: '',
    subject: '',
    type: 'stream',
    description: '',
    token_req: false,
    info_url: '',
    response_type: '',
  }
  exportDialogVisible.value = true
}

const addExport = async () => {
  if (!exportFormRef.value) return

  await exportFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      account.value = await accountApi.addAccountExport(props.accountId, exportForm.value)
      ElMessage.success('导出配置已添加')
      exportDialogVisible.value = false
      emit('refresh')
    } catch (error) {
      console.error('添加导出配置失败:', error)
      ElMessage.error('添加导出配置失败')
    } finally {
      submitting.value = false
    }
  })
}

const removeExport = async (name: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此导出配置吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    removing.value = true
    account.value = await accountApi.removeAccountExport(props.accountId, name)
    ElMessage.success('导出配置已删除')
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除导出配置失败:', error)
      ElMessage.error('删除导出配置失败')
    }
  } finally {
    removing.value = false
  }
}

const showAddImportDialog = () => {
  importForm.value = {
    name: '',
    account: '',
    subject: '',
    type: 'stream',
    to: '',
    token: '',
  }
  importDialogVisible.value = true
}

const addImport = async () => {
  if (!importFormRef.value) return

  await importFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      account.value = await accountApi.addAccountImport(props.accountId, importForm.value)
      ElMessage.success('导入配置已添加')
      importDialogVisible.value = false
      emit('refresh')
    } catch (error) {
      console.error('添加导入配置失败:', error)
      ElMessage.error('添加导入配置失败')
    } finally {
      submitting.value = false
    }
  })
}

const removeImport = async (name: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此导入配置吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    removing.value = true
    account.value = await accountApi.removeAccountImport(props.accountId, name)
    ElMessage.success('导入配置已删除')
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除导入配置失败:', error)
      ElMessage.error('删除导入配置失败')
    }
  } finally {
    removing.value = false
  }
}

const addSubject = () => {
  associationForm.value.subjects.push({
    subject: '',
    type: 'stream',
    description: '',
  })
}

const removeSubject = (index: number) => {
  associationForm.value.subjects.splice(index, 1)
}

const createAssociation = async () => {
  if (!associationFormRef.value) return

  await associationFormRef.value.validate(async (valid) => {
    if (!valid) return

    // 验证至少有一个 subject
    if (associationForm.value.subjects.length === 0) {
      ElMessage.warning('请至少添加一个 Subject')
      return
    }

    // 验证所有 subject 都已填写
    const hasEmptySubject = associationForm.value.subjects.some(
      (s) => !s.subject || !s.subject.trim()
    )
    if (hasEmptySubject) {
      ElMessage.warning('请填写所有 Subject')
      return
    }

    submitting.value = true
    try {
      await accountApi.createAccountAssociation(props.accountId, associationForm.value)
      ElMessage.success('导出关联已创建，目标账户将自动创建对应的导入配置')
      resetAssociationForm()
      await loadAccount()
      emit('refresh')
    } catch (error) {
      console.error('创建导出关联失败:', error)
      ElMessage.error('创建导出关联失败')
    } finally {
      submitting.value = false
    }
  })
}

const resetAssociationForm = () => {
  associationForm.value = {
    target_account_id: '',
    description: '',
    subjects: [
      {
        subject: '',
        type: 'stream',
        description: '',
      },
    ],
  }
  associationFormRef.value?.clearValidate()
}

const handleClose = () => {
  dialogVisible.value = false
}

// 当对话框打开时加载数据
watch(
  () => props.modelValue,
  async (visible) => {
    if (visible) {
      await Promise.all([loadAccount(), accountStore.fetchAccounts()])
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.sharing-tabs {
  min-height: 400px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .tab-description {
    color: var(--el-text-color-regular);
    margin: 0;
  }
}

.association-form {
  margin-top: 20px;
}

.subject-item {
  margin-bottom: 16px;

  .subject-row {
    display: flex;
    align-items: center;
    width: 100%;
  }
}

:deep(.el-table) {
  .el-table__header {
    th {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>

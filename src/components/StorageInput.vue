<template>
  <div class="storage-input-container">
    <div class="storage-input">
      <el-input-number
        v-model="localValue"
        :min="isUnlimited ? -1 : 1"
        :placeholder="'请输入数值'"
        :step="1"
        :disabled="isUnlimited"
        style="width: 200px"
        @change="handleValueChange"
      />
      <el-radio-group v-model="localUnit" class="unit-radio-group" @change="handleUnitChange">
        <el-radio-button v-for="option in unitOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div v-if="showHelp && allowUnlimited" class="form-help">选择“不限”表示无限制</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { StorageUnit } from '@/types'
import { getStorageUnitOptions } from '@/utils/storage'

interface Props {
  value?: number
  unit?: StorageUnit
  allowUnlimited?: boolean
  showHelp?: boolean
}

interface Emits {
  (e: 'update:value', value: number): void
  (e: 'update:unit', unit: StorageUnit): void
}

const props = withDefaults(defineProps<Props>(), {
  value: 1,
  unit: 'MB',
  allowUnlimited: false,
  showHelp: true,
})

const emit = defineEmits<Emits>()

const localValue = ref(props.value)
const localUnit = ref(props.unit)

const unitOptions = computed(() => {
  const options = getStorageUnitOptions()
  // 如果不允许无限制，过滤掉“不限”选项
  return props.allowUnlimited ? options : options.filter((opt) => opt.value !== 'B')
})
const isUnlimited = computed(() => localValue.value === -1)

const handleValueChange = (value: number | undefined) => {
  if (value !== undefined) {
    // 防止输入0，自动纠正为1
    if (value === 0) {
      localValue.value = 1
      emit('update:value', 1)
    } else {
      localValue.value = value
      emit('update:value', value)
    }
  }
}

const handleUnitChange = (unit: StorageUnit) => {
  // 如果选择“不限”，设置数值为-1
  if (unit === 'B') {
    localValue.value = -1
    localUnit.value = unit
    emit('update:value', -1)
    emit('update:unit', unit)
  } else {
    // 如果从“不限”切换到其他单位，恢复为默认值1
    if (localValue.value === -1) {
      localValue.value = 1
      emit('update:value', 1)
    }
    localUnit.value = unit
    emit('update:unit', unit)
  }
}

// 监听props变化
watch(
  () => props.value,
  (newValue) => {
    localValue.value = newValue
  }
)

watch(
  () => props.unit,
  (newUnit) => {
    localUnit.value = newUnit
  }
)
</script>

<style scoped lang="scss">
.storage-input-container {
  .storage-input {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .unit-radio-group {
    :deep(.el-radio-button__inner) {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
    }
  }

  .form-help {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>

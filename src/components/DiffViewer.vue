<template>
  <div class="diff-viewer">
    <div v-if="!hasDifferences" class="no-diff-message">
      <el-result
        icon="success"
        title="配置一致"
        sub-title="数据库配置与NATS集群配置完全一致，无需进行任何修改。"
      />
    </div>

    <div v-else>
      <!-- 专业Diff显示 -->
      <div class="diff-display">
        <div class="diff-header">
          <div class="header-item">
            <el-icon><Document /></el-icon>
            <span>详细配置对比</span>
          </div>
          <div class="diff-controls">
            <el-radio-group v-model="diffMode" size="small" @change="generateDiffHtml">
              <el-radio-button value="diff">只显示差异</el-radio-button>
              <el-radio-button value="full">显示全部文本</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 使用diff2html显示 -->
        <div
          class="diff-html-container"
          :class="{ 'full-mode': diffMode === 'full' }"
          v-html="diffHtml"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import * as Diff from 'diff'
import { html } from 'diff2html'

interface Props {
  databaseConfig?: any
  clusterConfig?: any
  hasDifferences: boolean
  differences?: Array<{
    field: string
    database_value: any
    cluster_value: any
  }>
}

const props = defineProps<Props>()

const diffHtml = ref('')
const diffMode = ref<'diff' | 'full'>('diff')

const formatValue = (value: any) => {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const generateDiffHtml = () => {
  if (!props.databaseConfig || !props.clusterConfig) {
    diffHtml.value = ''
    return
  }

  // 格式化配置为易读的JSON字符串
  const databaseConfigStr = JSON.stringify(props.databaseConfig, null, 2)
  const clusterConfigStr = JSON.stringify(props.clusterConfig, null, 2)

  let diff: string

  if (diffMode.value === 'full') {
    // 显示全部文本模式：生成完整对比diff
    diff = Diff.createTwoFilesPatch(
      '数据库期望配置',
      'NATS集群实际配置',
      databaseConfigStr,
      clusterConfigStr,
      '',
      '',
      { context: Infinity } // context设为无限大显示所有行
    )
  } else {
    // 只显示差异模式：默认上下文
    diff = Diff.createTwoFilesPatch(
      '数据库期望配置',
      'NATS集群实际配置',
      databaseConfigStr,
      clusterConfigStr,
      '',
      ''
    )
  }

  // 使用diff2html生成HTML
  diffHtml.value = html(diff, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: 'side-by-side',
    renderNothingWhenEmpty: false,
    synchronisedScroll: true,
  })
}

// 监听配置变化，重新生成diff
watch(
  () => [props.databaseConfig, props.clusterConfig, props.hasDifferences, diffMode.value],
  () => {
    if (props.hasDifferences && props.databaseConfig && props.clusterConfig) {
      generateDiffHtml()
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 80vh;
  overflow: hidden;
}

.no-diff-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* Diff显示区域 */
.diff-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;

  .diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--el-bg-color-page);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        font-size: 16px;
        color: var(--el-color-primary);
      }
    }

    .diff-controls {
      .el-radio-group {
        --el-radio-button-checked-bg-color: var(--el-color-primary);
        --el-radio-button-checked-text-color: #fff;
      }
    }
  }
}

.diff-html-container {
  flex: 1;
  overflow: auto;

  /* 重写diff2html的样式 */
  :deep(.d2h-wrapper) {
    border: none;
    margin: 0;
  }

  :deep(.d2h-file-header) {
    background: var(--el-bg-color-page);
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 8px 12px;
  }

  :deep(.d2h-file-name) {
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.d2h-code-side-by-side) {
    font-family:
      'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
  }

  :deep(.d2h-code-line) {
    padding: 2px 8px;
  }

  :deep(.d2h-code-line-number) {
    background: #f8f9fa;
    color: #6c757d;
    padding: 2px 8px;
    text-align: center;
    user-select: none;
  }

  :deep(.d2h-del) {
    background-color: #ffe5e5;

    .d2h-code-line-number {
      background-color: #ffcdd2;
    }
  }

  :deep(.d2h-ins) {
    background-color: #e8f5e8;

    .d2h-code-line-number {
      background-color: #c8e6c9;
    }
  }

  :deep(.d2h-code-wrapper) {
    overflow: auto;
  }
}
</style>

<style>
/* 自定义滚动条 */
.diff-html-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.diff-html-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

.diff-html-container::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;

  &:hover {
    background: #c0c4cc;
  }
}
</style>

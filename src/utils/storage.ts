import type { StorageUnit } from '@/types'

/**
 * 格式化存储大小为可读字符串
 * @param value 数值
 * @param unit 单位
 * @returns 格式化后的字符串，如 "1GB"
 */
export const formatStorage = (value: number, unit: StorageUnit): string => {
  if (value === -1) {
    return '不限'
  }
  return `${value}${unit}`
}

/**
 * 获取存储单位选项
 * @returns 存储单位选项数组
 */
export const getStorageUnitOptions = () => [
  { label: 'KB', value: 'KB' as StorageUnit },
  { label: 'MB', value: 'MB' as StorageUnit },
  { label: 'GB', value: 'GB' as StorageUnit },
  { label: 'TB', value: 'TB' as StorageUnit },
  { label: '不限', value: 'B' as StorageUnit },
]

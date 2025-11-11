import dayjs from 'dayjs'

/**
 * 统一的时间格式化函数
 * 将时间格式化为 YYYY-MM-DD HH:mm:ss 格式
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期（只显示日期部分）
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

/**
 * 格式化时间（只显示时间部分）
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).format('HH:mm:ss')
}

/**
 * 格式化相对时间（如：3分钟前）
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    return false
  }
}

/**
 * 格式化密钥显示（截断长密钥）
 */
export const formatKey = (key: string, maxLength: number = 20): string => {
  if (!key || key.length <= maxLength) return key
  const showLength = Math.floor((maxLength - 3) / 2)
  return `${key.substring(0, showLength)}...${key.substring(key.length - showLength)}`
}

/**
 * 格式化数字（添加千分位分隔符）
 */
export const formatNumber = (num: number): string => {
  if (num === 0) return '0'
  if (!num) return '-'
  return num.toLocaleString()
}

/**
 * 格式化字节大小
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (!bytes) return '-'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

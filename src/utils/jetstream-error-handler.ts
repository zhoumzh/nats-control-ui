// JetStream错误处理工具类
// 统一处理JetStream相关的错误信息，提供用户友好的错误提示

export interface AccountErrorInfo {
  type:
    | 'not_enabled'
    | 'connection_error'
    | 'permission_denied'
    | 'timeout'
    | 'account_not_found'
    | 'no_users'
    | 'database_error'
    | 'validation_error'
    | 'unknown'
  message: string
  action:
    | 'enable_jetstream'
    | 'retry'
    | 'check_permissions'
    | 'contact_admin'
    | 'create_user'
    | 'none'
  severity: 'error' | 'warning' | 'info'
  details?: string // 添加详细信息字段
  suggestion?: string // 添加建议操作字段
}

export class JetStreamErrorHandler {
  /**
   * 处理账户级别的JetStream错误
   */
  static handleAccountError(
    error: string | Error | any,
    accountName: string = '未知账户'
  ): AccountErrorInfo {
    const errorMessage =
      typeof error === 'string' ? error : error?.message || error?.toString() || '未知错误'
    const fullErrorDetails = typeof error === 'object' ? JSON.stringify(error) : errorMessage

    // 账户不存在
    if (this.isAccountNotFound(errorMessage)) {
      return {
        type: 'account_not_found',
        message: `账户 ${accountName} 不存在`,
        action: 'contact_admin',
        severity: 'error',
        details: '请检查账户配置或联系管理员',
        suggestion: '确认账户公钥是否正确',
      }
    }

    // 账户下无用户
    if (this.isNoUsersError(errorMessage)) {
      return {
        type: 'no_users',
        message: `账户 ${accountName} 下没有可用用户`,
        action: 'create_user',
        severity: 'warning',
        details: '需要至少一个活跃用户来访问JetStream资源',
        suggestion: '请创建一个管理员用户或激活现有用户',
      }
    }

    // 数据库错误
    if (this.isDatabaseError(errorMessage)) {
      return {
        type: 'database_error',
        message: `访问 ${accountName} 时发生数据库错误`,
        action: 'retry',
        severity: 'error',
        details: '数据库查询失败',
        suggestion: '请稍后重试，如问题持续请联系管理员',
      }
    }

    // 参数验证错误
    if (this.isValidationError(errorMessage)) {
      return {
        type: 'validation_error',
        message: `账户 ${accountName} 参数验证失败`,
        action: 'contact_admin',
        severity: 'error',
        details: '请求参数格式错误或缺失',
        suggestion: '请检查账户公钥格式是否正确',
      }
    }

    // JetStream未启用
    if (this.isJetStreamNotEnabled(errorMessage)) {
      return {
        type: 'not_enabled',
        message: `${accountName} 未启用 JetStream`,
        action: 'enable_jetstream',
        severity: 'info',
        details: 'JetStream功能未启用或配置不正确',
        suggestion: '点击“启用JetStream”按钮进行启用',
      }
    }

    // 连接错误
    if (this.isConnectionError(errorMessage)) {
      return {
        type: 'connection_error',
        message: `连接 ${accountName} 失败，请检查网络连接`,
        action: 'retry',
        severity: 'error',
        details: 'NATS集群连接失败或网络不可达',
        suggestion: '检查网络连接或联系管理员检查集群状态',
      }
    }

    // 权限错误
    if (this.isPermissionError(errorMessage)) {
      return {
        type: 'permission_denied',
        message: `访问 ${accountName} 被拒绝，权限不足`,
        action: 'check_permissions',
        severity: 'error',
        details: '用户JWT认证失败或权限不足',
        suggestion: '请联系管理员检查账户权限配置',
      }
    }

    // 超时错误
    if (this.isTimeoutError(errorMessage)) {
      return {
        type: 'timeout',
        message: `访问 ${accountName} 超时，请稍后重试`,
        action: 'retry',
        severity: 'warning',
        details: '请求超时或网络延迟',
        suggestion: '请稍后重试，如问题持续请检查网络连接',
      }
    }

    // 未知错误
    return {
      type: 'unknown',
      message: `加载 ${accountName} 信息失败`,
      action: 'contact_admin',
      severity: 'error',
      details: fullErrorDetails,
      suggestion: '请记录错误信息并联系技术支持',
    }
  }

  /**
   * 处理Stream级别的错误
   */
  static handleStreamError(
    error: string | Error | any,
    streamName: string = '未知流'
  ): AccountErrorInfo {
    const errorMessage =
      typeof error === 'string' ? error : error?.message || error?.toString() || '未知错误'

    if (this.isStreamNotFound(errorMessage)) {
      return {
        type: 'unknown',
        message: `流 ${streamName} 不存在或已被删除`,
        action: 'none',
        severity: 'warning',
      }
    }

    return this.handleAccountError(error, `流 ${streamName}`)
  }

  /**
   * 获取用户友好的错误提示
   */
  static getUserFriendlyMessage(errorInfo: AccountErrorInfo): string {
    const actionMessages = {
      enable_jetstream: '点击"启用JetStream"按钮进行启用',
      retry: '点击"重试"按钮重新加载',
      check_permissions: '请联系管理员检查账户权限',
      contact_admin: '如问题持续，请联系技术支持',
      none: '',
    }

    const actionMessage = actionMessages[errorInfo.action]
    return actionMessage ? `${errorInfo.message}。${actionMessage}` : errorInfo.message
  }

  /**
   * 获取错误类型对应的Element Plus消息类型
   */
  static getElementMessageType(
    severity: AccountErrorInfo['severity']
  ): 'success' | 'warning' | 'info' | 'error' {
    const typeMap = {
      error: 'error' as const,
      warning: 'warning' as const,
      info: 'info' as const,
    }
    return typeMap[severity]
  }

  // 私有方法：错误类型检测
  private static isJetStreamNotEnabled(message: string): boolean {
    const patterns = [
      'jetstream not enabled',
      'jetstream is not enabled',
      'no jetstream',
      'stream not found',
      'account does not have jetstream enabled',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern))
  }

  // 新增错误检测方法
  private static isAccountNotFound(message: string): boolean {
    const patterns = [
      'account not found',
      'account does not exist',
      'account not exist',
      '账户不存在',
      '账户未找到',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()))
  }

  private static isNoUsersError(message: string): boolean {
    const patterns = [
      'no users found',
      'no active users',
      'no available users',
      '无可用用户',
      '账户下无用户',
      '没有活跃用户',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()))
  }

  private static isDatabaseError(message: string): boolean {
    const patterns = [
      'database error',
      'database query failed',
      'db error',
      'sql error',
      '数据库错误',
      '数据库查询失败',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()))
  }

  private static isValidationError(message: string): boolean {
    const patterns = [
      'validation error',
      'validation failed',
      'invalid format',
      'invalid parameter',
      '参数验证失败',
      '格式错误',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()))
  }

  private static isConnectionError(message: string): boolean {
    const patterns = [
      'connection failed',
      'connection refused',
      'connection timeout',
      'network error',
      'dial tcp',
      'connection reset',
      'no route to host',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern))
  }

  private static isPermissionError(message: string): boolean {
    const patterns = [
      'permission denied',
      'access denied',
      'unauthorized',
      'forbidden',
      'authentication failed',
      'invalid credentials',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern))
  }

  private static isTimeoutError(message: string): boolean {
    const patterns = [
      'timeout',
      'request timeout',
      'context deadline exceeded',
      'operation timed out',
    ]
    return patterns.some((pattern) => message.toLowerCase().includes(pattern))
  }

  private static isStreamNotFound(message: string): boolean {
    const patterns = ['stream not found', 'stream does not exist', 'no such stream']
    return patterns.some((pattern) => message.toLowerCase().includes(pattern))
  }
}

// 导出默认实例供直接使用
export default JetStreamErrorHandler

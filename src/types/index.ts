// Base types
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Storage unit types
export type StorageUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB'

// Account related types
export interface Account extends BaseEntity {
  name: string
  description: string
  public_key: string
  nkey: string
  status: AccountStatus
  is_system_account: boolean // 是否为系统账户
  origin_cluster_id?: string // 所属集群ID
  cluster_name?: string // 账户所属集群名称，系统账户显示集群名，普通账户显示"不固定"
  limits?: AccountLimits
  jwt_claims?: Record<string, any>
}

export enum AccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export interface AccountLimits {
  max_connections: number
  max_leaf_nodes: number
  max_data_value: number
  max_data_unit: StorageUnit
  max_payload_value: number
  max_payload_unit: StorageUnit
  max_subscriptions: number
  jetstream_limits?: JetStreamAccountLimits
  imports?: Import[]
  exports?: Export[]
  default_permissions?: DefaultPermissions
}

export interface JetStreamAccountLimits {
  enabled: boolean
  memory_storage_value: number
  memory_storage_unit: StorageUnit
  disk_storage_value: number
  disk_storage_unit: StorageUnit
  streams: number
  consumers: number
  max_ack_pending: number
  memory_max_stream_bytes_value: number
  memory_max_stream_bytes_unit: StorageUnit
  disk_max_stream_bytes_value: number
  disk_max_stream_bytes_unit: StorageUnit
  max_bytes_required: boolean
}

export interface Import {
  name: string
  subject: string
  account: string
  token: string
  to: string
  type: ImportType
}

export enum ImportType {
  STREAM = 'stream',
  SERVICE = 'service',
}

export interface Export {
  name: string
  subject: string
  token_req: boolean
  response_type: string
  account_token_position: number
  revocations: string[]
  type: ExportType
  info?: ExportInfo
}

export enum ExportType {
  STREAM = 'stream',
  SERVICE = 'service',
}

export interface ExportInfo {
  description: string
  info_url: string
}

export interface DefaultPermissions {
  publish?: Permission
  subscribe?: Permission
  response?: ResponsePermission
}

export interface Permission {
  allow: string[]
  deny: string[]
}

export interface ResponsePermission {
  max_messages: number
  expires: number
}

// User related types
export interface User extends BaseEntity {
  name: string
  public_key: string
  nkey: string
  account_id: string
  status: UserStatus
  is_admin: boolean
  permissions?: UserPermissions
  limits?: UserLimits
  jwt_claims?: Record<string, any>
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export interface UserPermissions {
  publish?: Permission
  subscribe?: Permission
  response?: ResponsePermission
  jetstream?: JetStreamPermissions
}

export interface JetStreamPermissions {
  publish?: Permission
  subscribe?: Permission
}

export interface UserLimits {
  max_data_value: number
  max_data_unit: StorageUnit
  max_payload_value: number
  max_payload_unit: StorageUnit
  max_subscriptions: number
  jetstream_limits?: JetStreamUserLimits
  access_controls?: AccessControls
  connection_types: string[]
}

export interface JetStreamUserLimits {
  memory_storage_value: number
  memory_storage_unit: StorageUnit
  disk_storage_value: number
  disk_storage_unit: StorageUnit
  streams: number
  consumers: number
  max_ack_pending: number
}

export interface AccessControls {
  source_ips: string[]
  time_restrictions?: TimeRestrictions
}

export interface TimeRestrictions {
  start: string
  end: string
  timezone: string
  days_of_week: number[]
  hours_of_day: number[]
}

// JWT Task related types
export interface JWTTask extends BaseEntity {
  entity_type: EntityType
  entity_id: string
  public_key?: string // 冗余存储的账户公钥，用于快照和追溯
  operation: Operation
  status: TaskStatus
  trigger_type?: TriggerType // 触发方式：自动或手动
  error?: string // 后端字段名是 error，不是 error_message
  retries: number // 后端字段名是 retries，不是 retry_count
  max_retries: number
  payload?: Record<string, any>
  cluster_ids?: Record<string, any> // 集群ID列表
  sync_results?: Record<string, any> // 同步结果
  completed_at?: string // 后端字段名是 completed_at，前端期望 processed_at
}

export enum TriggerType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum EntityType {
  ACCOUNT = 'account',
  USER = 'user',
}

export enum Operation {
  CREATE = 'create',
  UPDATE = 'update',
  ENABLE = 'enable',
  DISABLE = 'disable',
}

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message: string
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface PaginationParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}

// Form types
export interface AccountForm {
  name: string
  description: string
  status: AccountStatus
  is_system_account: boolean // 是否为系统账户
  origin_cluster_id?: string // 所属集群ID，创建时必填，编辑时不可修改
  limits?: AccountLimitsForm
}

export interface AccountLimitsForm {
  max_connections: number
  max_leaf_nodes: number
  max_data_value: number
  max_data_unit: StorageUnit
  max_payload_value: number
  max_payload_unit: StorageUnit
  max_subscriptions: number
  jetstream_limits?: JetStreamAccountLimits
  imports?: Import[]
  exports?: Export[]
}

export interface UserForm {
  name: string
  account_id: string
  status: UserStatus
  is_admin: boolean
  permissions?: UserPermissionsForm
  limits?: UserLimitsForm
}

export interface UserPermissionsForm {
  publish_allow: string[]
  publish_deny: string[]
  subscribe_allow: string[]
  subscribe_deny: string[]
  response_max_messages: number
  response_expires: number
}

export interface UserLimitsForm {
  max_data_value: number
  max_data_unit: StorageUnit
  max_payload_value: number
  max_payload_unit: StorageUnit
  max_subscriptions: number
  source_ips: string[]
  connection_types: string[]
}

// Cluster related types
export interface Cluster extends BaseEntity {
  name: string
  description: string
  status: ClusterStatus
  // NATS连接配置 - 拆分为具体字段
  host: string
  nats_port: number
  gateway_port: number
  monitor_port: number
  cluster_port: number
  // 系统账户配置
  system_account_id?: string
  system_user_id?: string
}

export enum ClusterStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

// Cluster form types
export interface ClusterForm {
  name: string
  description: string
  status: ClusterStatus
  // NATS连接配置
  host: string
  nats_port: number
  gateway_port: number
  monitor_port: number
  cluster_port: number
  // 系统账户配置
  system_account_id?: string
  system_user_id?: string
}

// Cluster API request types
export interface CreateClusterRequest {
  name: string
  description: string
  // NATS连接配置
  host: string
  nats_port?: number // 默认4222
  gateway_port?: number // 默认7222
  monitor_port?: number // 默认8222
  cluster_port?: number // 默认6222
  // 系统账户配置
  system_account_id?: string
  system_user_id?: string
}

export interface UpdateClusterRequest {
  name?: string
  description?: string
  status?: ClusterStatus
  // NATS连接配置
  host?: string
  nats_port?: number
  gateway_port?: number
  monitor_port?: number
  cluster_port?: number
  // 系统账户配置
  system_account_id?: string
  system_user_id?: string
}

// Cluster connection test result
export interface ClusterTestResult {
  cluster_id: string
  cluster_name: string
  url: string
  status: 'success' | 'failed'
  message?: string
  error?: string
  tested_at: string
}

// Cluster monitoring types
export interface ClusterHealth extends BaseEntity {
  cluster_id: string
  status: ClusterHealthStatus
  connection_status: string // success, failed, timeout
  response_time: number // milliseconds
  error_message?: string
  nats_url: string
  monitor_url: string
  test_type: string // auto, manual
  tested_at: string
  cluster?: Cluster
}

export enum ClusterHealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface ClusterHealthResponse extends ClusterHealth {
  cluster_name?: string
  host_info?: string
}

export interface ClusterMonitorConfig extends BaseEntity {
  refresh_interval: number // seconds
  timeout_duration: number // seconds
  retry_attempts: number
  failure_threshold: number // consecutive failures to mark unhealthy
  recovery_threshold: number // consecutive successes to mark healthy
  enabled_clusters?: Record<string, boolean> // cluster IDs to monitor
}

export interface ClusterStats {
  total_clusters: number
  healthy_clusters: number
  unhealthy_clusters: number
  unknown_clusters: number
}

export interface ClusterMonitoringDashboardResponse {
  stats: ClusterStats
  unhealthy_count: number
  recent_failures: ClusterHealthResponse[]
  monitor_config: ClusterMonitorConfig
  last_update_time: string
}

export interface UpdateMonitorConfigRequest {
  refresh_interval: number // 5 seconds to 1 hour
  timeout_duration: number // 1 second to 1 minute
  retry_attempts: number // 1 to 10 attempts
  failure_threshold: number // 1 to 10 failures
  recovery_threshold: number // 1 to 10 successes
  enabled_clusters?: string[] // cluster IDs to enable monitoring
}

// Cluster topology types
export interface GatewayInfo {
  name: string
  host: string
  port: number
  inbound: GatewayInbound[]
  outbound: GatewayOutbound[]
}

export interface GatewayInbound {
  name: string
  host: string
  port: number
}

export interface GatewayOutbound {
  name: string
  host: string
  port: number
}

export interface ClusterTopologyNode {
  cluster_id: string
  cluster_name: string
  host: string
  gateway_port: number
  monitor_port: number
  connection_status: 'connected' | 'isolated'
  incoming_connections: ClusterConnection[]
  outgoing_connections: ClusterConnection[]
  gateway_urls: string[]
}

export interface ClusterConnection {
  from_cluster_id: string
  from_cluster_name: string
  to_cluster_id: string
  to_cluster_name: string
  connection_type: string // gateway
  status: string // active, inactive
}

export interface SuperClusterGroup {
  group_id: string
  group_name: string
  clusters: ClusterTopologyNode[]
  connections: ClusterConnection[]
}

export interface ClusterTopologyResponse {
  super_cluster_groups: SuperClusterGroup[]
  isolated_clusters: ClusterTopologyNode[]
  total_clusters: number
  connected_clusters: number
  isolated_count: number
  super_cluster_count: number
}

// JetStream related types
export interface JetStream extends BaseEntity {
  name: string
  description: string
  nats_operate_user_id: string // 替代旧的 creator_user_id
  cluster_id: string
  status: JetStreamStatus

  // 同步状态相关字段
  sync_status: JetStreamSyncStatus
  sync_message?: string // 同步备注信息
  sync_failure_reason?: string // 仅当 sync_status 为 sync_failed 时显示

  // Stream configuration
  subjects: string[]
  storage: JetStreamStorageType
  retention: JetStreamRetentionPolicy
  discard: JetStreamDiscardPolicy
  compression: JetStreamCompressionType

  // Limits configuration
  max_msgs: number // -1 means unlimited
  max_bytes_value: number
  max_bytes_unit: StorageUnit
  max_age: number // seconds
  max_msg_size_value: number
  max_msg_size_unit: StorageUnit
  max_consumers: number // -1 means unlimited

  // Replica and persistence configuration
  replicas: number
  no_ack: boolean
  duplicate_window: number // seconds
  allow_rollup_hdrs: boolean
  allow_direct: boolean
  mirror_direct: boolean
  deny_delete: boolean
  deny_purge: boolean

  // Placement tags and metadata
  placement_cluster?: string
  placement_tags?: string[]
  metadata?: Record<string, string>

  // Statistics
  messages: number
  bytes_value: number
  bytes_unit: StorageUnit
  first_seq: number
  last_seq: number
  num_consumers: number

  // Relations (not stored in database)
  nats_operate_user?: User // 关联的 NATS 操作用户
  cluster?: Cluster
}

export enum JetStreamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

export enum JetStreamSyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum JetStreamStorageType {
  FILE = 'file',
  MEMORY = 'memory',
}

export enum JetStreamRetentionPolicy {
  LIMITS = 'limits',
  INTEREST = 'interest',
  WORKQUEUE = 'workqueue',
}

export enum JetStreamDiscardPolicy {
  OLD = 'old',
  NEW = 'new',
}

export enum JetStreamCompressionType {
  NONE = 'none',
  S2 = 's2',
}

// JetStream form types
export interface JetStreamForm {
  name: string
  description: string
  nats_operate_user_id: string // 替代旧的 creator_user_id
  cluster_id: string

  // Stream configuration
  subjects: string[]
  storage: JetStreamStorageType
  retention: JetStreamRetentionPolicy
  discard: JetStreamDiscardPolicy
  compression: JetStreamCompressionType

  // Limits configuration
  max_msgs: number
  max_bytes_value: number
  max_bytes_unit: StorageUnit
  max_age: number
  max_msg_size_value: number
  max_msg_size_unit: StorageUnit
  max_consumers: number

  // Replica and persistence configuration
  replicas: number
  no_ack: boolean
  duplicate_window: number
  allow_rollup_hdrs: boolean
  allow_direct: boolean
  mirror_direct: boolean
  deny_delete: boolean
  deny_purge: boolean

  // Placement configuration
  placement_cluster?: string
  placement_tags?: string[]
  metadata?: Record<string, string>
}

// JetStream stats response
export interface JetStreamStatsResponse {
  total: number
  active: number
  inactive: number
  error: number
}

// JetStream name validation response
export interface JetStreamNameValidationResponse {
  valid: boolean
  message: string
}

// JetStream sync response
export interface JetStreamSyncResponse {
  message: string
  status: string
  stats?: {
    messages: number
    bytes_value: number
    bytes_unit: StorageUnit
    first_seq: number
    last_seq: number
    num_consumers: number
  }
}

// JetStream batch delete response
export interface JetStreamBatchDeleteResponse {
  deleted_count: number
  failed_count: number
  errors: string[]
}

// 标准化的JetStream账户信息响应
export interface JetStreamAccountInfo {
  account_id: string
  account_name?: string
  jetstream_enabled: boolean
  streams: StreamInfo[] | null
  error?: string
  last_updated: string
  stats?: AccountStreamStats
}

export interface DetectionApiConfig {
  max_memory: number
  max_storage: number
  store_dir: string
  sync_interval: number
  domain: string
  strict: boolean
}

export interface DetectionApiLevel {
  level: number
  total: number
  errors: number
}

export interface DetectionMetaCluster {
  name: string
  leader: string
  peer: string
  replicas: any[] | null
  cluster_size: number
  pending: number
}

export interface DetectionAccountDetail {
  name: string
  id: string
  memory_value: number
  memory_unit: string
  storage_value: number
  storage_unit: string
  reserved_memory_value: number
  reserved_memory_unit: string
  reserved_storage_value: number
  reserved_storage_unit: string
  accounts: number
  ha_assets: number
  api: DetectionApiLevel
}

export interface JetStreamDetectionResponse {
  memory_value: number
  memory_unit: string
  storage_value: number
  storage_unit: string
  reserved_memory_value: number
  reserved_memory_unit: string
  reserved_storage_value: number
  reserved_storage_unit: string
  accounts: number
  ha_assets: number
  api: DetectionApiLevel
  server_id: string
  now: string
  config: DetectionApiConfig
  limits: Record<string, any>
  streams: number
  consumers: number
  messages: number
  bytes: number
  meta_cluster: DetectionMetaCluster
  account_details: DetectionAccountDetail[]
  total: number
}

// 流信息
export interface StreamInfo {
  name: string
  config?: StreamConfig
  state?: StreamState
  status: 'active' | 'inactive' | 'error'
  error?: string
  created_at?: string
  cluster?: any
  created?: string
  ts?: string
}

// 流配置信息
export interface StreamConfig {
  name: string
  subjects: string[]
  storage: JetStreamStorageType
  retention: JetStreamRetentionPolicy
  discard: JetStreamDiscardPolicy
  compression: JetStreamCompressionType
  max_msgs: number
  max_bytes_value: number
  max_bytes_unit: StorageUnit
  max_age: number
  num_replicas: number
  no_ack: boolean
  allow_direct: boolean
  allow_rollup_hdrs: boolean
  deny_delete: boolean
  deny_purge: boolean
  duplicate_window: number
}

// 流状态信息
export interface StreamState {
  messages: number
  bytes_value: number
  bytes_unit: StorageUnit
  first_seq: number
  last_seq: number
  last_ts?: string
  consumer_count: number
}

// 账户流统计信息
export interface AccountStreamStats {
  total_streams: number
  total_messages: number
  total_bytes_value: number
  total_bytes_unit: StorageUnit
  total_consumers: number
  active_streams: number
  inactive_streams: number
  error_streams: number
}

// 批量获取JetStream信息的响应
export interface JetStreamBatchResponse {
  accounts: Record<string, JetStreamAccountInfo>
  error?: string
  requested_at: string
  stats?: BatchStats
}

// 批量请求统计
export interface BatchStats {
  total_requested: number
  successful: number
  failed: number
  skipped: number
}

// 树节点类型
export interface TreeNode {
  id: string
  label: string
  type: 'cluster' | 'account' | 'jetstream' | 'consumer'
  children?: TreeNode[]
  loading?: boolean
  expandable?: boolean | null // 可展开性：null=未检测，true=可展开，false=不可展开
  // 其他属性根据type不同而不同
  [key: string]: any
}

// NATS 集群节点相关类型
export interface ClusterServerInfo {
  name: string
  id: string
  cluster: string
  ver: string
  host: string
  jetstream: boolean
}

export interface ClusterServerStats {
  connections: number
  subscriptions: number
  sent: {
    msgs: number
  }
  received: {
    msgs: number
  }
  jetstream?: {
    stats: {
      api: {
        errors: number
      }
    }
    meta?: {
      leader: string
    }
  }
}

export interface ClusterServer {
  server: ClusterServerInfo
  statsz: ClusterServerStats
}

export interface ClusterServersResponse {
  servers: ClusterServer[]
  total_servers: number
  requested_at: string
}

// Consumer related types
export interface Consumer extends BaseEntity {
  name: string
  description: string
  jetstream_id: string
  cluster_id: string
  status: ConsumerStatus

  // Sync status
  sync_status: ConsumerSyncStatus
  sync_message?: string
  sync_failure_reason?: string

  // Consumer type
  consumer_type: ConsumerType

  // Consumer configuration
  durable: string
  ack_policy: ConsumerAckPolicy
  ack_wait: number // seconds
  max_deliver: number
  filter_subject?: string
  replay_policy: ConsumerReplayPolicy
  sample_freq?: string

  // Flow control
  rate_limit: number // bytes per second
  max_ack_pending: number
  max_waiting: number
  max_batch: number
  max_expires: number // nanoseconds

  // Advanced options
  inactive_threshold: number // seconds
  deliver_policy: ConsumerDeliverPolicy
  opt_start_seq?: number
  opt_start_time?: string
  deliver_subject?: string
  deliver_group?: string
  flow_control: boolean
  idle_heartbeat: number // seconds
  headers_only: boolean
  max_request_batch: number
  max_request_expires: number // nanoseconds
  max_request_max_bytes: number

  // Memory storage
  mem_storage: boolean
  replicas: number

  // Pause state
  paused: boolean
  pause_until?: string

  // Statistics
  delivered_count: number
  ack_pending_count: number
  redelivered_count: number
  num_pending: number

  // Relations
  jetstream?: JetStream
  cluster?: Cluster
}

export enum ConsumerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

export enum ConsumerSyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
}

export enum ConsumerAckPolicy {
  EXPLICIT = 'explicit',
  ALL = 'all',
  NONE = 'none',
}

export enum ConsumerReplayPolicy {
  INSTANT = 'instant',
  ORIGINAL = 'original',
}

export enum ConsumerDeliverPolicy {
  ALL = 'all',
  LAST = 'last',
  NEW = 'new',
  BY_START_SEQUENCE = 'by_start_sequence',
  BY_START_TIME = 'by_start_time',
  LAST_PER_SUBJECT = 'last_per_subject',
}

export enum ConsumerType {
  PULL = 'pull',
  PUSH = 'push',
}

// Consumer form types
export interface ConsumerForm {
  name: string
  description: string
  jetstream_id: string
  consumer_type: ConsumerType

  // Consumer configuration
  durable: string
  ack_policy: ConsumerAckPolicy
  ack_wait: number
  max_deliver: number
  filter_subject?: string
  replay_policy: ConsumerReplayPolicy
  sample_freq?: string

  // Flow control
  rate_limit: number
  max_ack_pending: number
  max_waiting: number
  max_batch: number
  max_expires: number

  // Advanced options
  inactive_threshold: number
  deliver_policy: ConsumerDeliverPolicy
  opt_start_seq?: number
  opt_start_time?: string
  deliver_subject?: string
  deliver_group?: string
  flow_control: boolean
  idle_heartbeat: number
  headers_only: boolean
  max_request_batch: number
  max_request_expires: number
  max_request_max_bytes: number

  // Memory storage
  mem_storage: boolean
  replicas: number
}

// Consumer stats response
export interface ConsumerStatsResponse {
  total: number
  active: number
  inactive: number
  error: number
  paused: number
}

export interface ConsumerDeliveredInfo {
  consumer_seq: number
  stream_seq: number
}

export interface ConsumerClusterInfo {
  name: string
  leader: string
}

export interface ConsumerConfig {
  durable_name: string
  name: string
  description?: string
  deliver_policy: string
  ack_policy: string
  ack_wait: number
  max_deliver: number
  replay_policy: string
  max_ack_pending: number
  deliver_subject?: string
  num_replicas: number
  metadata?: Record<string, any>
}

export interface ConsumerDetailInfo {
  stream_name: string
  name: string
  created: string
  config: ConsumerConfig
  delivered: ConsumerDeliveredInfo
  ack_floor: ConsumerDeliveredInfo
  num_ack_pending: number
  num_redelivered: number
  num_waiting: number
  num_pending: number
  cluster?: ConsumerClusterInfo
}

export interface ConsumerDetailResponse {
  consumer_info: ConsumerDetailInfo
  consumer_name: string
  jetstream_name: string
}

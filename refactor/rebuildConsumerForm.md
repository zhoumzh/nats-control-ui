二、创建必填字段
参数	必填	可选值 / 说明
Stream 名称	必填	已存在的 Stream。
Consumer 名称	必填	Durable 名称，唯一。
模式	必填	Push / Pull
Ack 模式	必填	AckNone / AckExplicit / AckAll
三、模式分支逻辑
1. Push 模式
   必需参数
   deliver_subject：推送的目标 subject。
   可选参数
   deliver_group（Queue Group 名，负载均衡用）。
   rate_limit_bps：流量上限（字节/秒）。
   flow_control（布尔）：是否启用流量控制。
   idle_heartbeat（时间）：无消息时心跳间隔，仅在 flow_control=true 时生效。
   限制
   不能包含 Pull 模式特有的参数。
2. Pull 模式
   必需参数
   无（除了基本 Consumer 名 / Stream 名）。
   可选参数
   max_batch：一次拉取最大条数。
   max_bytes：一次拉取最大字节数。
   max_expires：一次拉取最长等待时间。
   限制
   不能设置 deliver_subject 和 deliver_group。
   不支持 flow_control, idle_heartbeat, rate_limit_bps。
   四、消息过滤逻辑
   filter_subject：单个 subject 过滤。
   filter_subjects：多个 subject 过滤（新版本）。
   不指定时，消费整个 Stream 所有 subject。
   UI 应该根据所选 Stream 的 subjects 列表，允许单选/多选。
   五、重试与重新投递策略
   max_deliver：最大重新投递次数（默认为无限）。
   ack_wait：ack 超时时间，超过则重新投递。
   backoff：退避时间策略数组（例如 [100ms, 1s, 5s]）。
   retry_policy（可选）：重试类型，如 exponential 或 uniform。
   逻辑：
   如果 max_deliver=1 → 无重试。
   如果设置了 backoff → 将覆盖普通固定延时策略。
   六、投递策略（Deliver Policy）
   deliver_policy 取值：
   all：从 Stream 起始消息投递。
   new：仅新消息。
   last：从最后一条消息开始。
   last_per_subject：每个 subject 的最后一条。
   by_start_sequence：需设置 start_seq。
   by_start_time：需设置 start_time。
   UI 表单应：
   当选择 by_start_sequence 时显示 start_seq 输入框。
   当选择 by_start_time 时显示时间选择器。
   七、高级设置
   sample_freq：监控采样频率，如 1 表示每条采样，10 表示每 10 条采样一次。
   metadata：键值对标签，便于管理。
   replicas：副本数（仅在 JetStream 集群模式下可用）。
   八、逻辑顺序（交互流程）
   选择 Stream（下拉）

输入 Consumer 名称（Durable）

选择模式（Push / Pull）

Push 模式分支

Delivery Subject（必填）
Queue Group（可选）
Rate Limit（可选）
Flow Control（开关）
Idle Heartbeat（Flow Control 开启时可设）
Pull 模式分支

Max Batch（可选）
Max Bytes（可选）
Max Expires（可选）
Ack 模式（必选）

消息过滤（单选/多选 subject）

重试策略

Max Deliver
Ack Wait
Backoff 数组
Retry Policy
投递策略

Deliver Policy 枚举
Start Seq / Start Time （按策略显示）
高级设置

Sample Freq
Metadata
Replicas
确认并生成 JSON 配置（表单联动校验不同模式的有效参数）
{
"$schema": "http://json-schema.org/draft/2020-12/schema",
"title": "NATS JetStream Durable Consumer Configuration",
"type": "object",
"properties": {
"stream_name": {
"title": "Stream 名称",
"type": "string",
"description": "已存在的 Stream 名称"
},
"consumer_name": {
"title": "Consumer 名称（Durable）",
"type": "string",
"description": "唯一的持久 Consumer 名称"
},
"mode": {
"title": "模式",
"type": "string",
"enum": ["push", "pull"],
"description": "Push 或 Pull 模式"
},
"ack_policy": {
"title": "Ack 策略",
"type": "string",
"enum": ["AckNone", "AckExplicit", "AckAll"],
"default": "AckExplicit"
},

    "deliver_subject": {
      "title": "Deliver Subject",
      "type": "string",
      "description": "Push 模式必填；服务器推送消息的目标 subject"
    },
    "deliver_group": {
      "title": "Queue Group",
      "type": "string",
      "description": "Push 模式可选；用于负载均衡的消费组"
    },
    "rate_limit_bps": {
      "title": "Rate Limit (Bps)",
      "type": "integer",
      "minimum": 0,
      "description": "Push 模式可选；每秒最大字节数"
    },
    "flow_control": {
      "title": "启用 Flow Control",
      "type": "boolean",
      "default": false
    },
    "idle_heartbeat": {
      "title": "Idle Heartbeat",
      "type": "string",
      "pattern": "^[0-9]+(ms|s|m)$",
      "description": "Push 模式下 Flow Control 开启时可选，如 '5s', '100ms'"
    },

    "max_batch": {
      "title": "Max Batch",
      "type": "integer",
      "minimum": 1,
      "description": "Pull 模式可选；一次拉取最大条数"
    },
    "max_bytes": {
      "title": "Max Bytes",
      "type": "integer",
      "minimum": 1,
      "description": "Pull 模式可选；一次拉取最大字节数"
    },
    "max_expires": {
      "title": "Max Expires",
      "type": "string",
      "pattern": "^[0-9]+(ms|s|m)$",
      "description": "Pull 模式可选；一次拉取最长等待时间"
    },

    "filter_subject": {
      "title": "Filter Subject",
      "type": "string",
      "description": "单个过滤 subject"
    },
    "filter_subjects": {
      "title": "Filter Subjects",
      "type": "array",
      "items": { "type": "string" },
      "description": "多个过滤 subject（新版本支持）"
    },

    "max_deliver": {
      "title": "Max Deliver",
      "type": "integer",
      "minimum": 1,
      "description": "最大重新投递次数"
    },
    "ack_wait": {
      "title": "Ack Wait",
      "type": "string",
      "pattern": "^[0-9]+(ms|s|m)$",
      "description": "Ack 超时时间，例如 '30s'"
    },
    "backoff": {
      "title": "Backoff 时间数组",
      "type": "array",
      "items": { "type": "string", "pattern": "^[0-9]+(ms|s|m)$" },
      "description": "重试退避时间序列"
    },
    "retry_policy": {
      "title": "Retry Policy",
      "type": "string",
      "enum": ["exponential", "uniform"]
    },

    "deliver_policy": {
      "title": "Deliver Policy",
      "type": "string",
      "enum": [
        "all",
        "new",
        "last",
        "last_per_subject",
        "by_start_sequence",
        "by_start_time"
      ],
      "default": "all"
    },
    "start_seq": {
      "title": "Start Sequence",
      "type": "integer",
      "minimum": 1,
      "description": "仅当 deliver_policy=by_start_sequence 时必填"
    },
    "start_time": {
      "title": "Start Time",
      "type": "string",
      "format": "date-time",
      "description": "仅当 deliver_policy=by_start_time 时必填"
    },

    "sample_freq": {
      "title": "Sample Frequency",
      "type": "string",
      "description": "监控采样频率，例如 '100' 表示每 100 条"
    },
    "metadata": {
      "title": "Metadata",
      "type": "object",
      "additionalProperties": { "type": "string" },
      "description": "自定义元数据标签"
    },
    "replicas": {
      "title": "Replicas",
      "type": "integer",
      "minimum": 1,
      "description": "副本数（集群模式）"
    }
},

"required": ["stream_name", "consumer_name", "mode", "ack_policy"],

"allOf": [
{
"if": { "properties": { "mode": { "const": "push" } } },
"then": {
"required": ["deliver_subject"],
"properties": {
"max_batch": { "not": {} },
"max_bytes": { "not": {} },
"max_expires": { "not": {} }
}
}
},
{
"if": { "properties": { "mode": { "const": "pull" } } },
"then": {
"properties": {
"deliver_subject": { "not": {} },
"deliver_group": { "not": {} },
"rate_limit_bps": { "not": {} },
"flow_control": { "not": {} },
"idle_heartbeat": { "not": {} }
}
}
},
{
"if": { "properties": { "deliver_policy": { "const": "by_start_sequence" } } },
"then": { "required": ["start_seq"] }
},
{
"if": { "properties": { "deliver_policy": { "const": "by_start_time" } } },
"then": { "required": ["start_time"] }
},
{
"if": {
"properties": {
"flow_control": { "const": true },
"mode": { "const": "push" }
}
},
"then": { "required": ["idle_heartbeat"] }
}
]
}
## 一、最终骨干核心字段（融合你的集群 & 同步状态）

| 字段名 | 说明 | 类型 | 示例 |
|--------|------|------|------|
| **Consumer 名称** | Durable 名称，唯一标识 | string | `order_consumer_1` |
| **Stream 名称** | 关联的 Stream | string | `ORDERS_STREAM` |
| **集群名称** | JetStream 所在集群名 | string | `cluster-east` |
| **模式** | Push / Pull | enum | `Push` |
| **Ack 策略** | AckNone / AckExplicit / AckAll | enum | `AckExplicit` |
| **Deliver Policy** | 投递策略摘要 | enum | `all` |
| **过滤 Subject** | 若启用过滤则显示，否则 `-` | string | `orders.*` |
| **最大重试次数** | Max Deliver | number | `5` |
| **Ack Wait** | Ack 等待时间 | string | `30s` |
| **状态** | 数据库端记录的消费状态（活跃 / 暂停 / 删除等） | enum | `活跃` |
| **同步状态** | 数据库 -> NATS 同步结果 | object/string | 成功 / 失败 + 错误消息 |
| **创建时间** | Consumer 创建时间（数据库记录时间） | datetime | `2024-06-01 14:23` |

---

### 二、同步状态字段设计建议

**同步状态**在列表页建议分成两部分：
1. **同步结果枚举**：`成功` / `失败` / `进行中`。
2. **错误信息**（可选列或鼠标悬停提示）：保存最后一次同步的错误说明，例如 `"NATS server unreachable"`。

> 优化 UI：
> - 列表中显示结果枚举，颜色区分（绿色成功、红色失败、黄色进行中）。
> - 鼠标 hover 或点击图标显示错误详情，避免占用太多表格空间。

---

## 三、最终固定列定义（前端表格）

```javascript
[
  { title: "集群名称", dataIndex: "cluster_name", width: 150 },
  { title: "Consumer 名称", dataIndex: "consumer_name", width: 200 },
  { title: "Stream 名称", dataIndex: "stream_name", width: 200 },
  { title: "模式", dataIndex: "mode", width: 80 },
  { title: "Ack 策略", dataIndex: "ack_policy", width: 120 },
  { title: "Deliver Policy", dataIndex: "deliver_policy", width: 120 },
  { title: "过滤 Subject", dataIndex: "filter_subject", width: 200 },
  { title: "最大重试次数", dataIndex: "max_deliver", width: 120 },
  { title: "Ack Wait", dataIndex: "ack_wait", width: 120 },
  { title: "状态", dataIndex: "status", width: 100 },
  { title: "同步状态", dataIndex: "sync_status", width: 100 },
  { title: "创建时间", dataIndex: "created_at", width: 180 }
]
```

---

## 四、列表页 JSON Schema（用于表格 & 数据接口约束）

```json
{
  "$schema": "http://json-schema.org/draft/2020-12/schema",
  "title": "NATS Durable Consumer List",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "cluster_name": {
        "title": "集群名称",
        "type": "string",
        "description": "JetStream 所在集群名"
      },
      "consumer_name": {
        "title": "Consumer 名称",
        "type": "string",
        "description": "唯一的 Durable Consumer 名称"
      },
      "stream_name": {
        "title": "Stream 名称",
        "type": "string"
      },
      "mode": {
        "title": "模式",
        "type": "string",
        "enum": ["push", "pull"]
      },
      "ack_policy": {
        "title": "Ack 策略",
        "type": "string",
        "enum": ["AckNone", "AckExplicit", "AckAll"]
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
        ]
      },
      "filter_subject": {
        "title": "过滤 Subject",
        "type": "string"
      },
      "max_deliver": {
        "title": "最大重试次数",
        "type": "integer",
        "minimum": 1
      },
      "ack_wait": {
        "title": "Ack Wait",
        "type": "string",
        "pattern": "^[0-9]+(ms|s|m)$"
      },
      "status": {
        "title": "状态",
        "type": "string",
        "enum": ["active", "paused", "deleted"]
      },
      "sync_status": {
        "title": "同步状态",
        "type": "object",
        "properties": {
          "result": { "type": "string", "enum": ["success", "failed", "pending"] },
          "message": { "type": "string" }
        },
        "required": ["result"]
      },
      "created_at": {
        "title": "创建时间",
        "type": "string",
        "format": "date-time"
      }
    },
    "required": [
      "cluster_name",
      "consumer_name",
      "stream_name",
      "mode",
      "ack_policy",
      "deliver_policy",
      "status",
      "sync_status",
      "created_at"
    ]
  }
}
```

---

### 优点：
- **固定列**，两种模式都能显示，前端不需要判断。
- **集群字段**和**同步状态字段**已内置。
- 同步状态带详细信息支持，前端可用悬停 tooltip 或弹窗显示 `message`。
- 这个 Schema 也能约束后端 API 输出，避免前端出现列错位或缺字段。
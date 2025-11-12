<template>
  <div class="cluster-detail">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="info" link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回集群列表
        </el-button>
        <div class="cluster-title">
          <h2 v-if="currentCluster">{{ currentCluster.name }}</h2>
          <el-tag
            v-if="currentCluster"
            :type="currentCluster.status === 'active' ? 'success' : 'danger'"
            class="status-tag"
          >
            {{ currentCluster.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-progress
          v-if="loading"
          :percentage="loadingProgress"
          :stroke-width="6"
          :width="120"
          type="circle"
          class="loading-progress"
        />
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Panel - Tree Navigation -->
      <div class="left-panel">
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="tree-header">
              <el-icon><FolderOpened /></el-icon>
              <span>集群资源</span>
            </div>
          </template>

          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            @node-click="handleNodeClick"
            :expand-on-click-node="false"
            class="cluster-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <img
                  v-if="data.type === 'cluster'"
                  :src="clusterIcon"
                  class="node-icon-img"
                  alt="cluster"
                />
                <img
                  v-else-if="data.type === 'consumer'"
                  :src="consumerIcon"
                  class="node-icon-img"
                  alt="consumer"
                />
                <img
                  v-else-if="data.type === 'jetstream'"
                  :src="getJetStreamIcon(data)"
                  class="node-icon-img"
                  alt="jetstream"
                />
                <img
                  v-else-if="data.type === 'account'"
                  :src="getAccountIcon(data)"
                  class="node-icon-img"
                  alt="account"
                />
                <el-icon v-else class="node-icon">
                  <component :is="getNodeIcon(data, node.expanded)" />
                </el-icon>
                <span class="node-label">{{ node.label }}</span>

                <!-- 懒加载状态指示器 -->
                <div v-if="data.loading" class="loading-container">
                  <el-icon class="loading-icon loading-spin">
                    <Loading />
                  </el-icon>
                  <span class="loading-text">加载中...</span>
                </div>

                <!-- 错误状态指示器 -->
                <div v-else-if="getNodeError(data.id)" class="error-container">
                  <el-tooltip :content="getNodeError(data.id)?.message" placement="top">
                    <el-icon class="error-icon">
                      <Warning />
                    </el-icon>
                  </el-tooltip>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click.stop="retryLoadAccount(data)"
                    class="retry-button"
                  >
                    重试
                  </el-button>
                </div>

                <!-- 成功状态标签 -->
                <div v-else class="status-tags">
                  <el-tag
                    v-if="data.type === 'cluster'"
                    :type="data.status === 'active' ? 'success' : 'danger'"
                    size="small"
                    effect="plain"
                    class="node-tag"
                  >
                    {{ data.status === 'active' ? '活跃' : '禁用' }}
                  </el-tag>

                  <el-tag
                    v-if="data.type === 'account' && data.jetStreamEnabled === false"
                    type="info"
                    size="small"
                    effect="plain"
                    class="node-tag"
                  >
                    未开启
                  </el-tag>

                  <el-tag
                    v-if="data.type === 'account' && data.expandable === false"
                    type="warning"
                    size="small"
                    effect="plain"
                    class="node-tag"
                  >
                    无流
                  </el-tag>

                  <el-tag
                    v-if="data.type === 'jetstream'"
                    :type="getJetStreamStatusType(data.status)"
                    size="small"
                    effect="plain"
                    class="node-tag"
                  >
                    {{ getJetStreamStatusText(data.status) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-tree>
        </el-card>
      </div>

      <!-- Right Panel - Detail View -->
      <div class="right-panel">
        <el-card shadow="never" class="detail-card" v-loading="loading">
          <!-- Cluster Info -->
          <div v-if="selectedNode?.type === 'cluster'" class="cluster-info">
            <div class="detail-header">
              <h3>集群信息</h3>
            </div>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="集群ID">{{ currentCluster?.id }}</el-descriptions-item>
              <el-descriptions-item label="集群名称">{{
                currentCluster?.name
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentCluster?.status === 'active' ? 'success' : 'danger'">
                  {{ currentCluster?.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="主机地址">{{
                currentCluster?.host
              }}</el-descriptions-item>
              <el-descriptions-item label="NATS端口">{{
                currentCluster?.nats_port || 4222
              }}</el-descriptions-item>
              <el-descriptions-item label="网关端口">{{
                currentCluster?.gateway_port || 7222
              }}</el-descriptions-item>
              <el-descriptions-item label="监控端口">{{
                currentCluster?.monitor_port || 8222
              }}</el-descriptions-item>
              <el-descriptions-item label="集群端口">{{
                currentCluster?.cluster_port || 6222
              }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{
                currentCluster?.description || '暂无描述'
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                formatDateTime(currentCluster?.created_at || new Date())
              }}</el-descriptions-item>
            </el-descriptions>

            <div class="detail-section">
              <h4>账户统计</h4>
              <el-row :gutter="12">
                <el-col :span="12" :md="6">
                  <el-statistic title="总账户数" :value="accountStats.total" />
                </el-col>
                <el-col :span="12" :md="6">
                  <el-statistic title="已开启JetStream" :value="accountStats.jetStreamEnabled" />
                </el-col>
                <el-col :span="12" :md="6">
                  <el-statistic title="活跃账户" :value="accountStats.active" />
                </el-col>
                <el-col :span="12" :md="6">
                  <el-statistic title="系统账户" :value="accountStats.system" />
                </el-col>
              </el-row>
            </div>

            <!-- 集群信息详情 -->
            <div v-if="currentCluster" class="detail-section">
              <h4>集群配置信息</h4>
              <el-table :data="getClusterConfigDetails(currentCluster)" border stripe size="small">
                <el-table-column prop="label" label="配置项" width="180" />
                <el-table-column prop="value" label="配置值" min-width="200" />
                <el-table-column prop="description" label="说明" min-width="300" />
              </el-table>
            </div>
          </div>

          <!-- Account Info -->
          <div v-else-if="selectedNode?.type === 'account'" class="account-info">
            <div class="detail-header">
              <h3>账户信息</h3>
              <div class="header-actions">
                <el-button
                  v-if="selectedNode.jetStreamEnabled"
                  type="primary"
                  size="small"
                  @click="refreshJetStreamInfo"
                  :loading="loading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新信息
                </el-button>
              </div>
            </div>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="账户名称">{{ selectedNode.name }}</el-descriptions-item>
              <el-descriptions-item label="账户ID">{{
                getAccountFullDetails()?.id || 'N/A'
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedNode.status === 'active' ? 'success' : 'danger'">
                  {{ selectedNode.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="JetStream">
                <el-tag :type="selectedNode.jetStreamEnabled ? 'success' : 'info'">
                  {{ selectedNode.jetStreamEnabled ? '已开启' : '未开启' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="系统账户">
                <el-tag :type="selectedNode.is_system_account ? 'warning' : 'info'">
                  {{ selectedNode.is_system_account ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="公钥">{{
                getAccountFullDetails()?.public_key || 'N/A'
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                formatDateTime(getAccountFullDetails()?.created_at || new Date())
              }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{
                formatDateTime(getAccountFullDetails()?.updated_at || new Date())
              }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{
                selectedNode.description || getAccountFullDetails()?.description || '暂无描述'
              }}</el-descriptions-item>
            </el-descriptions>

            <!-- JetStream Detection Info - 显示Detection API返回的所有信息 -->
            <div v-if="selectedNode.detectionData" class="detail-section">
              <div class="jetstream-header">
                <h4>JetStream Detection 信息</h4>
              </div>
              <el-row :gutter="12">
                <el-col :span="24" :md="6">
                  <el-statistic title="流数量" :value="selectedNode.detectionData.streams || 0" />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="消费者数量"
                    :value="selectedNode.detectionData.consumers || 0"
                  />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="总消息数"
                    :value="selectedNode.detectionData.messages || 0"
                  />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="字节数"
                    :value="formatBytes(selectedNode.detectionData.bytes || 0)"
                  />
                </el-col>
              </el-row>

              <!-- 存储信息 -->
              <el-descriptions :column="2" border size="small" style="margin-top: 16px">
                <el-descriptions-item label="内存使用">
                  {{ selectedNode.detectionData.memory_value }}
                  {{ selectedNode.detectionData.memory_unit }}
                </el-descriptions-item>
                <el-descriptions-item label="存储使用">
                  {{ selectedNode.detectionData.storage_value }}
                  {{ selectedNode.detectionData.storage_unit }}
                </el-descriptions-item>
                <el-descriptions-item label="预留内存">
                  {{ selectedNode.detectionData.reserved_memory_value }}
                  {{ selectedNode.detectionData.reserved_memory_unit }}
                </el-descriptions-item>
                <el-descriptions-item label="预留存储">
                  {{ selectedNode.detectionData.reserved_storage_value }}
                  {{ selectedNode.detectionData.reserved_storage_unit }}
                </el-descriptions-item>
                <el-descriptions-item label="账户数">
                  {{ selectedNode.detectionData.accounts }}
                </el-descriptions-item>
                <el-descriptions-item label="HA资产">
                  {{ selectedNode.detectionData.ha_assets }}
                </el-descriptions-item>
              </el-descriptions>

              <!-- API信息 -->
              <div style="margin-top: 16px">
                <h5>API状态</h5>
                <el-descriptions :column="3" border size="small">
                  <el-descriptions-item label="级别">
                    {{ selectedNode.detectionData.api.level }}
                  </el-descriptions-item>
                  <el-descriptions-item label="总调用">
                    {{ selectedNode.detectionData.api.total }}
                  </el-descriptions-item>
                  <el-descriptions-item label="错误数">
                    <el-tag
                      :type="selectedNode.detectionData.api.errors > 0 ? 'danger' : 'success'"
                    >
                      {{ selectedNode.detectionData.api.errors }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 集群元信息 -->
              <div style="margin-top: 16px">
                <h5>元集群信息</h5>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="集群名称">
                    {{ selectedNode.detectionData.meta_cluster.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="领导者">
                    {{ selectedNode.detectionData.meta_cluster.leader }}
                  </el-descriptions-item>
                  <el-descriptions-item label="集群大小">
                    {{ selectedNode.detectionData.meta_cluster.cluster_size }}
                  </el-descriptions-item>
                  <el-descriptions-item label="待处理数">
                    {{ selectedNode.detectionData.meta_cluster.pending }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 配置信息 -->
              <div style="margin-top: 16px">
                <h5>配置详情</h5>
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="最大内存">
                    {{ formatBytes(selectedNode.detectionData.config.max_memory) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="最大存储">
                    {{ formatBytes(selectedNode.detectionData.config.max_storage) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="存储目录">
                    {{ selectedNode.detectionData.config.store_dir }}
                  </el-descriptions-item>
                  <el-descriptions-item label="同步间隔">
                    {{ selectedNode.detectionData.config.sync_interval }} ns
                  </el-descriptions-item>
                  <el-descriptions-item label="域名">
                    {{ selectedNode.detectionData.config.domain }}
                  </el-descriptions-item>
                  <el-descriptions-item label="严格模式">
                    <el-tag :type="selectedNode.detectionData.config.strict ? 'success' : 'info'">
                      {{ selectedNode.detectionData.config.strict ? '是' : '否' }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>

          <!-- JetStream Info -->
          <div v-else-if="selectedNode?.type === 'jetstream'" class="jetstream-info">
            <div class="detail-header">
              <h3>JetStream 详情</h3>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="refreshJetStreamInfo"
                  :loading="loading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeleteJetStream"
                  :loading="deletingJetStream"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>

            <!-- 主要信息表格 -->
            <el-table
              :data="[selectedNode]"
              border
              stripe
              size="small"
              class="jetstream-main-table"
            >
              <el-table-column label="基本信息" width="120">
                <template #default>
                  <div class="table-group">基本信息</div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="流名称" width="150" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getJetStreamStatusType(row.status || 'active')" size="small">
                    {{ getJetStreamStatusText(row.status || 'active') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="存储类型" width="100">
                <template #default="{ row }">
                  {{ row.config?.storage || 'N/A' }}
                </template>
              </el-table-column>
              <el-table-column label="保留策略" width="100">
                <template #default="{ row }">
                  {{ row.config?.retention || 'N/A' }}
                </template>
              </el-table-column>
              <el-table-column label="压缩类型" width="100">
                <template #default="{ row }">
                  {{ row.config?.compression || 'N/A' }}
                </template>
              </el-table-column>
            </el-table>

            <!-- 统计信息表格 -->
            <el-table
              :data="[selectedNode]"
              border
              stripe
              size="small"
              class="jetstream-stats-table"
            >
              <el-table-column label="统计信息" width="120">
                <template #default>
                  <div class="table-group">统计信息</div>
                </template>
              </el-table-column>
              <el-table-column label="消息数" width="120">
                <template #default="{ row }">
                  {{ formatNumber(row.state?.messages || 0) }}
                </template>
              </el-table-column>
              <el-table-column label="字节数" width="120">
                <template #default="{ row }">
                  {{ formatBytes(row.state?.bytes || 0) }}
                </template>
              </el-table-column>
              <el-table-column label="消费者数" width="100">
                <template #default="{ row }">
                  {{ row.state?.consumer_count || 0 }}
                </template>
              </el-table-column>
              <el-table-column label="副本数" width="100">
                <template #default="{ row }">
                  {{ row.config?.num_replicas || 1 }}
                </template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="180">
                <template #default="{ row }">
                  {{ row.created ? formatDateTime(row.created) : 'N/A' }}
                </template>
              </el-table-column>
            </el-table>

            <!-- Subjects - 重要信息优先显示 -->
            <div
              v-if="selectedNode?.config?.subjects?.length > 0"
              class="subjects-section priority-section"
            >
              <div class="subjects-header">
                <h4>
                  <el-icon><Files /></el-icon> Subjects 主题列表
                </h4>
                <el-tag type="success" size="large" class="subjects-count-badge">
                  <el-icon><Connection /></el-icon>
                  {{ selectedNode?.config?.subjects?.length || 0 }} 个主题
                </el-tag>
              </div>
              <div class="subjects-container">
                <div class="subjects-list">
                  <el-tag
                    v-for="subject in selectedNode?.config?.subjects || []"
                    :key="subject"
                    class="subject-tag"
                    type="primary"
                    effect="light"
                    size="large"
                  >
                    <el-icon><Connection /></el-icon>
                    {{ subject }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 序列信息 -->
            <div v-if="selectedNode?.state" class="detail-section">
              <h4>序列信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="首序列号">{{
                  selectedNode.state.first_seq || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="末序列号">{{
                  selectedNode.state.last_seq || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="首次时间戳">{{
                  selectedNode.state.first_ts ? formatDateTime(selectedNode.state.first_ts) : 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="最后时间戳">{{
                  selectedNode.state.last_ts ? formatDateTime(selectedNode.state.last_ts) : 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="已删除消息数" :span="2">{{
                  selectedNode.state.num_deleted || 0
                }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 配置详情表格 -->
            <div class="detail-section">
              <h4>配置详情</h4>
              <el-table
                :data="getConfigDetails(selectedNode)"
                border
                stripe
                size="small"
                class="config-details-table"
              >
                <el-table-column prop="label" label="配置项" width="180" />
                <el-table-column prop="value" label="配置值" min-width="200">
                  <template #default="{ row }">
                    <el-tag
                      v-if="row.type === 'boolean'"
                      :type="row.value ? 'success' : 'info'"
                      size="small"
                    >
                      {{ row.value ? '是' : '否' }}
                    </el-tag>
                    <span v-else>{{ row.value }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明" min-width="300" />
              </el-table>
            </div>

            <!-- 集群信息 -->
            <div v-if="selectedNode?.cluster" class="detail-section">
              <h4>集群详情</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="集群名称" :span="2">{{
                  selectedNode.cluster.name || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="领导者">{{
                  selectedNode.cluster.leader || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="领导者开始时间" :span="2">{{
                  selectedNode.cluster.leader_since
                    ? formatDateTime(selectedNode.cluster.leader_since)
                    : 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="Raft组">{{
                  selectedNode.cluster.raft_group || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="系统账户">
                  <el-tag
                    :type="selectedNode.cluster.system_account ? 'success' : 'info'"
                    size="small"
                  >
                    {{ selectedNode.cluster.system_account ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="副本数量" :span="2">{{
                  selectedNode.cluster.replicas?.length || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="副本状态" :span="2">
                  <div v-if="selectedNode.cluster.replicas?.length > 0" class="replicas-list">
                    <el-tag
                      v-for="replica in selectedNode.cluster.replicas"
                      :key="replica.name"
                      :type="replica.current ? 'success' : 'info'"
                      size="small"
                      class="replica-tag"
                    >
                      {{ replica.name }} - 活跃: {{ Math.floor(replica.active / 1000000000) }}s
                    </el-tag>
                  </div>
                  <span v-else>无副本信息</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>

          <!-- Consumer Info -->
          <div v-else-if="selectedNode?.type === 'consumer'" class="consumer-info">
            <div class="detail-header">
              <h3>Consumer 详情</h3>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="refreshConsumerInfo"
                  :loading="loading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeleteConsumer"
                  :loading="deletingConsumer"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>

            <!-- 基本信息 -->
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Consumer名称">{{
                consumerDetail?.consumer_info?.name || selectedNode.name
              }}</el-descriptions-item>
              <el-descriptions-item label="Stream名称">{{
                consumerDetail?.consumer_info?.stream_name || 'N/A'
              }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{
                consumerDetail?.consumer_info?.created
                  ? formatDateTime(consumerDetail.consumer_info.created)
                  : 'N/A'
              }}</el-descriptions-item>
              <el-descriptions-item label="描述">{{
                consumerDetail?.consumer_info?.config?.description || '暂无描述'
              }}</el-descriptions-item>
            </el-descriptions>

            <!-- 配置信息 -->
            <div class="detail-section">
              <h4>配置信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="持久化名称">{{
                  consumerDetail?.consumer_info?.config?.durable_name || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="投递策略">{{
                  consumerDetail?.consumer_info?.config?.deliver_policy || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="确认策略">{{
                  consumerDetail?.consumer_info?.config?.ack_policy || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="确认等待时间">
                  {{
                    consumerDetail?.consumer_info?.config?.ack_wait
                      ? formatNanoseconds(consumerDetail.consumer_info.config.ack_wait)
                      : 'N/A'
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="最大投递次数">
                  {{
                    consumerDetail?.consumer_info?.config?.max_deliver === -1
                      ? '无限制'
                      : consumerDetail?.consumer_info?.config?.max_deliver || 0
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="重放策略">{{
                  consumerDetail?.consumer_info?.config?.replay_policy || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="最大待确认消息数">{{
                  consumerDetail?.consumer_info?.config?.max_ack_pending || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="副本数">{{
                  consumerDetail?.consumer_info?.config?.num_replicas || 1
                }}</el-descriptions-item>
                <el-descriptions-item label="投递目标主题" :span="2">{{
                  consumerDetail?.consumer_info?.config?.deliver_subject || '未配置'
                }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 统计信息 -->
            <div class="detail-section">
              <h4>消费统计</h4>
              <el-row :gutter="12">
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="待处理消息数"
                    :value="consumerDetail?.consumer_info?.num_pending || 0"
                  />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="待确认消息数"
                    :value="consumerDetail?.consumer_info?.num_ack_pending || 0"
                  />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="重新投递次数"
                    :value="consumerDetail?.consumer_info?.num_redelivered || 0"
                  />
                </el-col>
                <el-col :span="24" :md="6">
                  <el-statistic
                    title="等待拉取数"
                    :value="consumerDetail?.consumer_info?.num_waiting || 0"
                  />
                </el-col>
              </el-row>
            </div>

            <!-- 序列信息 -->
            <div class="detail-section">
              <h4>序列信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="Consumer已投递序列号">{{
                  consumerDetail?.consumer_info?.delivered?.consumer_seq || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="Stream已投递序列号">{{
                  consumerDetail?.consumer_info?.delivered?.stream_seq || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="Consumer确认序列号">{{
                  consumerDetail?.consumer_info?.ack_floor?.consumer_seq || 0
                }}</el-descriptions-item>
                <el-descriptions-item label="Stream确认序列号">{{
                  consumerDetail?.consumer_info?.ack_floor?.stream_seq || 0
                }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 集群信息 -->
            <div v-if="consumerDetail?.consumer_info?.cluster" class="detail-section">
              <h4>集群信息</h4>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="集群名称">{{
                  consumerDetail.consumer_info.cluster.name || 'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="领导者节点">{{
                  consumerDetail.consumer_info.cluster.leader || 'N/A'
                }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 元数据 -->
            <div v-if="consumerDetail?.consumer_info?.config?.metadata" class="detail-section">
              <h4>元数据</h4>
              <el-table
                :data="formatMetadata(consumerDetail.consumer_info.config.metadata)"
                border
                stripe
                size="small"
              >
                <el-table-column prop="key" label="键" width="200" />
                <el-table-column prop="value" label="值" min-width="200" />
              </el-table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <el-empty description="请选择左侧资源查看详情" :image-size="100" />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  FolderOpened,
  Folder,
  Monitor,
  Files,
  Connection,
  Loading,
  Warning,
  Delete,
} from '@element-plus/icons-vue'
import { useClusterStore } from '@/stores/clusters'
import { useAccountStore } from '@/stores/accounts'
import { useClusterTree } from '@/composables/use-cluster-tree'
import { formatDateTime, formatNumber, formatBytes } from '@/utils'
import type { Cluster, TreeNode, ConsumerDetailResponse } from '@/types'
import consumerIcon from '@/assets/icons/consumer.png'
import streamHasConsumerIcon from '@/assets/icons/stream-hasconsumer.png'
import streamNoConsumerIcon from '@/assets/icons/stream-noconsumer.png'
import accountEmptyIcon from '@/assets/icons/account-empty.png'
import accountHasStreamIcon from '@/assets/icons/account-hastream.png'
import clusterIcon from '@/assets/icons/Nats.png'

const route = useRoute()
const router = useRouter()
const clusterStore = useClusterStore()

// 集群ID
const clusterId = computed(() => route.params.id as string)
const currentCluster = computed(() => clusterStore.clusters.find((c) => c.id === clusterId.value))

// 从路由 state 获取集群对象
const clusterFromRoute = history.state?.cluster as Cluster | undefined

// 使用新的树管理composable
const {
  treeNodes,
  selectedNode,
  loading,
  loadingProgress,
  errors,
  accountStats,
  initializeTree,
  handleNodeClick,
  refreshJetStreamInfo,
  loadAccountJetStreamInfo,
  getNodeError,
  clearNodeError,
  clearAccountCache,
  findParentAccount,
} = useClusterTree(clusterId.value, clusterFromRoute)

const deletingJetStream = ref(false)
const deletingConsumer = ref(false)
const consumerDetail = ref<ConsumerDetailResponse | null>(null)

// 树配置
const treeProps = {
  children: 'children',
  label: 'label',
  disabled: 'disabled',
  isLeaf: (data: TreeNode) => {
    // 根据节点类型和可展开性判断是否为叶子节点
    if (data.type === 'cluster') {
      return false // 集群节点总是可展开的
    } else if (data.type === 'account') {
      // 账户节点根据可展开性判断
      if (data.expandable === false) {
        return true // 不可展开的账户节点是叶子节点
      } else {
        return false // 可展开或未检测的账户节点不是叶子节点
      }
    } else if (data.type === 'jetstream') {
      return false // JetStream节点可能有consumer子节点
    } else {
      return true // consumer节点是叶子节点
    }
  },
}

// 树数据 - 使用composable提供的数据
const treeData = computed(() => treeNodes.value)

const handleRefresh = async () => {
  await initializeTree()
}

const retryLoadAccount = async (accountNode: TreeNode) => {
  // 清除错误状态
  clearNodeError(accountNode.id)
  // 清除缓存，强制重新加载
  if (accountNode.public_key) {
    clearAccountCache(accountNode.public_key)
  }
  // 重新加载数据
  await loadAccountJetStreamInfo(accountNode)
}

// 删除JetStream
const handleDeleteJetStream = async () => {
  if (!selectedNode.value || selectedNode.value.type !== 'jetstream') {
    ElMessage.error('请选择要删除的JetStream')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要从集群删除JetStream "${selectedNode.value.name}" 吗？此操作只会删除服务器上的JetStream，不会删除数据库记录。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    deletingJetStream.value = true

    // 获取流名称
    const streamName = selectedNode.value.name
    if (!streamName) {
      ElMessage.error('无法获取JetStream流名称')
      return
    }

    // 获取父账户的account_id
    const parentAccount = findParentAccount(selectedNode.value.id)
    if (!parentAccount?.accountId) {
      ElMessage.error('无法获取父账户信息')
      return
    }

    // 导入集群API
    const { clusterApi } = await import('@/api/clusters')

    // 调用集群层面的删除API
    await clusterApi.deleteClusterJetStreamStream(
      clusterId.value,
      parentAccount.accountId,
      streamName
    )

    ElMessage.success('JetStream删除成功')

    // 刷新树结构
    await initializeTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除JetStream失败:', error)
      ElMessage.error('删除JetStream失败')
    }
  } finally {
    deletingJetStream.value = false
  }
}

// 删除Consumer
const handleDeleteConsumer = async () => {
  if (!selectedNode.value || selectedNode.value.type !== 'consumer') {
    ElMessage.error('请选择要删除的Consumer')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要从集群删除Consumer "${selectedNode.value.name}" 吗？此操作只会删除服务器上的Consumer，不会删除数据库记录。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    deletingConsumer.value = true

    // 获取Consumer名称和JetStream名称
    const consumerName = selectedNode.value.name
    const jetstreamName = selectedNode.value.jetstreamName

    if (!consumerName || !jetstreamName) {
      ElMessage.error('无法获取Consumer或JetStream名称')
      return
    }

    // 找到父JetStream节点，再找到其父Account节点
    const findJetStreamNode = (nodeId: string): TreeNode | null => {
      const findInNodes = (nodes: TreeNode[]): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === nodeId) return node
          if (node.children) {
            const found = findInNodes(node.children)
            if (found) return found
          }
        }
        return null
      }
      return findInNodes(treeNodes.value)
    }

    const jetstreamNode = findJetStreamNode(`jetstream_${jetstreamName}`)
    if (!jetstreamNode) {
      ElMessage.error('无法找到父JetStream节点')
      return
    }

    const parentAccount = findParentAccount(jetstreamNode.id)
    if (!parentAccount?.accountId) {
      ElMessage.error('无法获取父账户信息')
      return
    }

    // 导入集群API
    const { clusterApi } = await import('@/api/clusters')

    // 调用集群层面的删除API
    await clusterApi.deleteClusterJetStreamConsumer(
      clusterId.value,
      parentAccount.accountId,
      jetstreamName,
      consumerName
    )

    ElMessage.success('Consumer删除成功')

    // 刷新树结构
    await initializeTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除Consumer失败:', error)
      ElMessage.error('删除Consumer失败')
    }
  } finally {
    deletingConsumer.value = false
  }
}

const goBack = () => {
  router.push('/clusters')
}

const getAccountFullDetails = () => {
  if (!selectedNode.value || selectedNode.value.type !== 'account') return null
  const accountStore = useAccountStore()
  const accountId = selectedNode.value.id.replace('account_', '')
  return accountStore.accounts.find((acc) => acc.id === accountId)
}

// Lifecycle
onMounted(() => {
  initializeTree()
})

// Watch selectedNode to auto-load consumer details
watch(
  selectedNode,
  (newNode) => {
    if (newNode?.type === 'consumer') {
      refreshConsumerInfo()
    } else {
      consumerDetail.value = null
    }
  },
  { immediate: false }
)

// Helper functions for template
const getNodeIcon = (nodeData: TreeNode, expanded: boolean) => {
  switch (nodeData.type) {
    case 'cluster':
      return expanded ? 'FolderOpened' : 'Folder'
    case 'account':
      // 根据可展开性和展开状态选择图标
      if (nodeData.expandable === false) {
        // 不可展开（无JetStream数据）
        return 'Monitor'
      } else if (nodeData.expandable === true) {
        // 可展开（有JetStream数据）
        return expanded ? 'FolderOpened' : 'Folder'
      } else {
        // 未检测状态，默认显示可展开
        return expanded ? 'FolderOpened' : 'Folder'
      }
    case 'jetstream':
      return 'Files'
    default:
      return 'Folder'
  }
}

// 获取 JetStream 节点的图标
const getJetStreamIcon = (nodeData: TreeNode) => {
  // 判断是否有消费者：检查 children 或 state.consumer_count
  const hasConsumers =
    (nodeData.children && nodeData.children.length > 0) ||
    (nodeData.state?.consumer_count && nodeData.state.consumer_count > 0)
  return hasConsumers ? streamHasConsumerIcon : streamNoConsumerIcon
}

// 获取 Account 节点的图标
const getAccountIcon = (nodeData: TreeNode) => {
  // 判断是否有流：检查 expandable 属性或 children
  const hasStreams =
    nodeData.expandable === true || (nodeData.children && nodeData.children.length > 0)
  return hasStreams ? accountHasStreamIcon : accountEmptyIcon
}

const getJetStreamStatusType = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'error':
      return 'danger'
    case 'inactive':
    default:
      return 'info'
  }
}

const getJetStreamStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'error':
      return '错误'
    case 'inactive':
    default:
      return '非活跃'
  }
}

const getTotalConsumers = (jetStreamInfo: any) => {
  if (!jetStreamInfo?.streams) return 0
  return jetStreamInfo.streams.reduce(
    (total: number, stream: any) => total + (stream.state?.consumer_count || 0),
    0
  )
}

const getTotalMessages = (jetStreamInfo: any) => {
  if (!jetStreamInfo?.streams) return 0
  return jetStreamInfo.streams.reduce(
    (total: number, stream: any) => total + (stream.state?.messages || 0),
    0
  )
}

const getClusterConfigDetails = (cluster: any) => {
  if (!cluster) return []
  return [
    { label: '集群名称', value: cluster.name || 'N/A', description: '集群的唯一标识名称' },
    { label: '主机地址', value: cluster.host || 'N/A', description: 'NATS服务器主机地址' },
    { label: 'NATS端口', value: cluster.nats_port || 4222, description: 'NATS客户端连接端口' },
    { label: '网关端口', value: cluster.gateway_port || 7222, description: '集群间网关连接端口' },
    { label: '监控端口', value: cluster.monitor_port || 8222, description: 'HTTP监控接口端口' },
    { label: '集群端口', value: cluster.cluster_port || 6222, description: '集群内部通信端口' },
    {
      label: '状态',
      value: cluster.status === 'active' ? '活跃' : '禁用',
      description: '集群当前运行状态',
    },
  ]
}

const getConfigDetails = (jetstream: any) => {
  if (!jetstream?.config) return []
  return [
    {
      label: '流名称',
      value: jetstream.config.name || jetstream.name || 'N/A',
      description: 'JetStream流的唯一名称',
    },
    {
      label: '存储类型',
      value: jetstream.config.storage || 'file',
      description: '消息存储方式：文件或内存',
    },
    {
      label: '保留策略',
      value: jetstream.config.retention || 'limits',
      description: '消息保留策略',
    },
    {
      label: '丢弃策略',
      value: jetstream.config.discard || 'old',
      description: '存储满时的消息丢弃策略',
    },
    {
      label: '压缩类型',
      value: jetstream.config.compression || 'none',
      description: '消息压缩算法',
    },
    {
      label: '最大消息数',
      value: jetstream.config.max_msgs === -1 ? '无限制' : jetstream.config.max_msgs || 0,
      description: '流中最大消息数量',
    },
    {
      label: '最大字节数',
      value:
        jetstream.config.max_bytes === -1 ? '无限制' : formatBytes(jetstream.config.max_bytes || 0),
      description: '流的最大存储空间',
    },
    {
      label: '消息过期时间',
      value: jetstream.config.max_age
        ? `${Math.round(jetstream.config.max_age / 3600)}小时`
        : '永久',
      description: '消息自动过期时间',
    },
    { label: '副本数', value: jetstream.config.num_replicas || 1, description: '消息副本数量' },
    {
      label: '禁用确认',
      value: jetstream.config.no_ack ? '是' : '否',
      type: 'boolean',
      description: '是否禁用消息确认机制',
    },
    {
      label: '允许直接访问',
      value: jetstream.config.allow_direct ? '是' : '否',
      type: 'boolean',
      description: '是否允许直接访问消息',
    },
    {
      label: '允许汇总标头',
      value: jetstream.config.allow_rollup_hdrs ? '是' : '否',
      type: 'boolean',
      description: '是否允许消息汇总标头',
    },
    {
      label: '禁止删除',
      value: jetstream.config.deny_delete ? '是' : '否',
      type: 'boolean',
      description: '是否禁止删除消息',
    },
    {
      label: '禁止清除',
      value: jetstream.config.deny_purge ? '是' : '否',
      type: 'boolean',
      description: '是否禁止清除整个流',
    },
  ]
}

// JetStream信息访问器（用于向后兼容）
const jetStreamInfo = computed(() => {
  if (selectedNode.value?.type !== 'account') return null

  // 从树节点数据构造兼容的jetStreamInfo对象
  return {
    streams: selectedNode.value.children || [],
    jetstream_enabled: selectedNode.value.jetStreamEnabled || false,
    stats: selectedNode.value.stats || null,
  }
})

const formatNanoseconds = (ns: number): string => {
  if (ns >= 1e9) {
    return `${(ns / 1e9).toFixed(1)}s`
  } else if (ns >= 1e6) {
    return `${(ns / 1e6).toFixed(1)}ms`
  } else {
    return `${ns}ns`
  }
}

const formatMetadata = (metadata: Record<string, any>) => {
  return Object.entries(metadata).map(([key, value]) => ({
    key,
    value: typeof value === 'object' ? JSON.stringify(value) : String(value),
  }))
}

const refreshConsumerInfo = async () => {
  if (!selectedNode.value || selectedNode.value.type !== 'consumer') {
    return
  }

  try {
    loading.value = true
    const { clusterApi } = await import('@/api/clusters')

    const jetstreamName = selectedNode.value.jetstreamName
    const consumerName = selectedNode.value.name

    if (!jetstreamName || !consumerName) {
      ElMessage.error('无法获取Consumer信息')
      return
    }

    consumerDetail.value = await clusterApi.getClusterJetStreamConsumerDetail(
      clusterId.value,
      jetstreamName,
      consumerName
    )
  } catch (error) {
    console.error('获取Consumer详情失败:', error)
    ElMessage.error('获取Consumer详情失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cluster-detail {
  padding: 16px 24px;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-progress {
  flex-shrink: 0;
}

.cluster-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cluster-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.status-tag {
  margin-left: 8px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.left-panel {
  width: 280px;
  flex-shrink: 0;
  min-width: 280px;
}

.tree-card {
  height: 600px;
  max-height: calc(100vh - 200px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  :deep(.el-card__header) {
    padding: 16px 20px;
    background-color: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  :deep(.el-card__body) {
    padding: 0;
    height: calc(100% - 72px);
    overflow-y: auto;
  }
}

.tree-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.cluster-tree {
  padding: 16px;

  :deep(.el-tree-node__content) {
    height: 40px;
    line-height: 40px;
    border-radius: 6px;
    margin-bottom: 2px;
    transition: background-color 0.2s;
  }

  :deep(.el-tree-node__content:hover) {
    background-color: var(--el-fill-color-light);
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 4px;
  position: relative;
}

.node-icon {
  font-size: 16px;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.node-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

/* 加载状态容器 */
.loading-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 2px 8px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 12px;
  border: 1px solid var(--el-color-primary-light-7);
}

.loading-icon {
  font-size: 14px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.loading-text {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.loading-spin {
  animation: spin 1s linear infinite;
}

/* 错误状态容器 */
.error-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 2px 8px;
  background-color: var(--el-color-error-light-9);
  border-radius: 12px;
  border: 1px solid var(--el-color-error-light-7);
}

.error-icon {
  font-size: 14px;
  color: var(--el-color-error);
  flex-shrink: 0;
}

.retry-button {
  font-size: 12px;
  padding: 0 8px;
  height: 20px;
  border-radius: 10px;
}

/* 成功状态标签容器 */
.status-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.node-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.node-tag {
  font-size: 11px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.detail-card {
  min-height: 600px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  :deep(.el-card__body) {
    padding: 20px;
    overflow-y: auto;
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-border-color-extra-light);
}

.detail-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.detail-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail-section:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.detail-section h4 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.detail-section h5 {
  margin: 20px 0 16px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.streams-section {
  margin-top: 20px;
}

.subjects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.subject-tag {
  margin: 0;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-blank);
  border-radius: 8px;
}

/* 优化描述组件间距 */
:deep(.el-descriptions) {
  margin-bottom: 20px;
}

:deep(.el-descriptions__body .el-descriptions__table) {
  border-spacing: 0;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  background-color: var(--el-fill-color-extra-light);
  width: 140px;
  min-width: 140px;
}

/* 优化统计组件间距 */
:deep(.el-statistic) {
  text-align: center;
  padding: 12px;
  background-color: var(--el-fill-color-blank);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-extra-light);
  margin-bottom: 8px;
}

:deep(.el-statistic__head) {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

:deep(.el-statistic__content) {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
}

/* 优化表格间距 */
:deep(.el-table) {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

/* Subjects 重要信息样式 */
.priority-section {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-success-light-9)
  );
  padding: 20px;
  border-radius: 12px;
  border: 2px solid var(--el-color-primary-light-7);
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.subjects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subjects-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.subjects-count-badge {
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 20px;
}

.subjects-container {
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
}

:deep(.el-table th) {
  background-color: var(--el-fill-color-extra-light);
  font-weight: 600;
}

/* 优化行间距 */
:deep(.el-row) {
  margin-bottom: 12px;
}

:deep(.el-row:last-child) {
  margin-bottom: 0;
}

/* JetStream 表格优化 */
.jetstream-main-table,
.jetstream-stats-table,
.config-details-table {
  margin-top: 0;
  margin-bottom: 16px;
}

.table-group {
  font-weight: 600;
  color: var(--el-color-primary);
  text-align: center;
}

.jetstream-main-table :deep(.el-table__row:first-child td:first-child),
.jetstream-stats-table :deep(.el-table__row:first-child td:first-child) {
  background-color: var(--el-color-primary-light-9);
  border-right: 2px solid var(--el-color-primary-light-5);
}

.config-details-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-light);
}

.config-details-table :deep(.el-table__row td) {
  vertical-align: top;
  padding: 12px 8px;
}

/* JetStream form styles */
.jetstream-form {
  max-height: 70vh;
  overflow-y: auto;
}

.jetstream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.subjects-tags {
  min-height: 32px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  background-color: var(--el-fill-color-extra-light);
}

.subject-tag {
  margin: 2px 4px 2px 0;
}

.jetstream-empty {
  margin-top: 20px;
  padding: 40px;
  text-align: center;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 8px;
  border: 2px dashed var(--el-border-color-light);
}

.jetstream-disabled {
  margin-top: 20px;
  padding: 40px;
  text-align: center;
  background-color: var(--el-color-info-light-9);
  border-radius: 8px;
  border: 2px dashed var(--el-color-info-light-5);
}

.jetstream-disabled .el-empty__description p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

.jetstream-no-stats {
  margin-top: 20px;
  padding: 40px;
  text-align: center;
  background-color: var(--el-color-warning-light-9);
  border-radius: 8px;
  border: 2px dashed var(--el-color-warning-light-5);
}

.jetstream-no-stats .el-empty__description p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

/* Dialog footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form responsive */
@media (max-width: 768px) {
  .jetstream-form :deep(.el-col) {
    width: 100% !important;
    margin-bottom: 16px;
  }

  .jetstream-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* Form item tips */
.form-item-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.help-tip {
  color: var(--el-text-color-regular);
}

.no-users-tip {
  color: var(--el-color-warning);
}

.no-active-users-tip {
  color: var(--el-color-warning);
}

.form-item-tip .el-link {
  font-size: 12px;
}

/* Replicas list styling */
.replicas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.replica-tag {
  margin: 0;
}
</style>

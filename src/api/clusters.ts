import apiClient from './client'
import type {
  Cluster,
  ClusterForm,
  CreateClusterRequest,
  UpdateClusterRequest,
  ClusterTestResult,
  PaginationParams,
  ClusterHealthResponse,
  ClusterTopologyResponse,
  JetStreamAccountInfo,
  JetStreamDetectionResponse,
  ClusterServersResponse,
  ConsumerDetailResponse,
} from '@/types'

export const clusterApi = {
  // Get all clusters
  getClusters(params?: PaginationParams): Promise<Cluster[]> {
    return apiClient.get('/clusters', { params }).then((res) => res.data)
  },

  // Get cluster by ID
  getCluster(id: string): Promise<Cluster> {
    return apiClient.get(`/clusters/${id}`).then((res) => res.data)
  },

  // Create cluster
  createCluster(data: CreateClusterRequest): Promise<Cluster> {
    return apiClient.post('/clusters', data).then((res) => res.data)
  },

  // Update cluster
  updateCluster(id: string, data: UpdateClusterRequest): Promise<Cluster> {
    return apiClient.put(`/clusters/${id}`, data).then((res) => res.data)
  },

  // Enable cluster
  enableCluster(id: string): Promise<void> {
    return apiClient.post(`/clusters/${id}/enable`).then((res) => res.data)
  },

  // Disable cluster
  disableCluster(id: string): Promise<void> {
    return apiClient.post(`/clusters/${id}/disable`).then((res) => res.data)
  },

  // Test cluster connection
  testClusterConnection(id: string): Promise<ClusterTestResult> {
    return apiClient.post(`/clusters/${id}/test`).then((res) => res.data)
  },

  // Cluster monitoring APIs

  // Get cluster health records
  getClusterHealthRecords(params?: {
    cluster_id?: string
    status?: string
    connection_status?: string
    start_date?: string
    end_date?: string
    page?: number
    page_size?: number
  }): Promise<{
    data: ClusterHealthResponse[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }> {
    return apiClient.get('/clusters/health', { params }).then((res) => res.data)
  },

  // Get cluster monitoring dashboard
  getMonitoringDashboard(): Promise<any> {
    return apiClient.get('/clusters/monitoring/dashboard').then((res) => res.data)
  },

  // Trigger manual health check
  triggerManualHealthCheck(id: string): Promise<ClusterHealthResponse> {
    return apiClient.post(`/clusters/${id}/health-check`).then((res) => res.data)
  },

  // Get cluster topology
  getClusterTopology(): Promise<ClusterTopologyResponse> {
    return apiClient.get('/clusters/topology').then((res) => res.data)
  },

  // Get cluster JetStream detection information (for expandability check)
  getClusterJetStreamDetection(
    clusterId: string,
    accountPublicKey?: string,
    pageSize?: number
  ): Promise<JetStreamDetectionResponse> {
    const params: any = {}
    if (accountPublicKey) params.acc = accountPublicKey
    if (pageSize) params.page_size = pageSize
    return apiClient
      .get(`/clusters/${clusterId}/jetstream/detection`, { params })
      .then((res) => res.data)
  },

  // Get actual cluster JetStream information (for real stream list)
  getClusterJetStreamInfo(
    clusterId: string,
    accountId?: string,
    pageSize?: number
  ): Promise<string[]> {
    const params: any = {}
    if (accountId) params.account_id = accountId
    if (pageSize) params.page_size = pageSize
    return apiClient
      .get(`/clusters/${clusterId}/jetstream/actuality`, { params })
      .then((res) => res.data)
  },

  // Get detailed cluster JetStream information (for expanded view)
  getClusterJetStreamInfoDetailed(
    clusterId: string,
    accountId: string,
    streamName: string
  ): Promise<any> {
    const params = { account_id: accountId, stream: streamName }
    return apiClient
      .get(`/clusters/${clusterId}/jetstream/info`, { params })
      .then((res) => res.data)
  },

  // Delete a JetStream stream from cluster
  deleteClusterJetStreamStream(
    clusterId: string,
    accountId: string,
    streamName: string
  ): Promise<void> {
    const params = { account_id: accountId, stream: streamName }
    return apiClient
      .delete(`/clusters/${clusterId}/jetstream/stream`, { params })
      .then((res) => res.data)
  },

  // Get cluster node count
  getClusterNodeCount(clusterId: string): Promise<{ node_count: number }> {
    return apiClient.get(`/clusters/${clusterId}/node-count`).then((res) => res.data)
  },

  // Get cluster servers/nodes information
  getClusterServers(clusterId: string): Promise<ClusterServersResponse> {
    return apiClient.get(`/clusters/${clusterId}/servers`).then((res) => res.data)
  },

  // Get JetStream consumers
  getClusterJetStreamConsumers(
    clusterId: string,
    jetstreamName: string
  ): Promise<{
    consumers: string[]
    jetstream_id: string
    total: number
  }> {
    return apiClient
      .get(`/clusters/${clusterId}/jetstream/${jetstreamName}/consumers`)
      .then((res) => res.data)
  },

  getClusterJetStreamConsumerDetail(
    clusterId: string,
    jetstreamName: string,
    consumerName: string
  ): Promise<ConsumerDetailResponse> {
    return apiClient
      .get(`/clusters/${clusterId}/jetstream/${jetstreamName}/consumers/${consumerName}`)
      .then((res) => res.data)
  },

  // Delete a JetStream consumer from cluster
  deleteClusterJetStreamConsumer(
    clusterId: string,
    accountId: string,
    streamName: string,
    consumerName: string
  ): Promise<void> {
    const params = { account_id: accountId, stream_name: streamName, consumer_name: consumerName }
    return apiClient
      .delete(`/clusters/${clusterId}/jetstream/consumer`, { params })
      .then((res) => res.data)
  },
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clusterApi } from '@/api/clusters'
import type {
  Cluster,
  CreateClusterRequest,
  UpdateClusterRequest,
  PaginationParams,
  ClusterTestResult,
} from '@/types'
import { ElMessage } from 'element-plus'

export const useClusterStore = defineStore('cluster', () => {
  const clusters = ref<Cluster[]>([])
  const currentCluster = ref<Cluster | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  const fetchClusters = async (params?: PaginationParams) => {
    loading.value = true
    try {
      const response = await clusterApi.getClusters({
        page: currentPage.value,
        page_size: pageSize.value,
        ...params,
      })
      clusters.value = response
      total.value = response.length
    } catch (error) {
      console.error('Failed to fetch clusters:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchCluster = async (id: string) => {
    loading.value = true
    try {
      const response = await clusterApi.getCluster(id)
      currentCluster.value = response

      // 如果 clusters 数组中不存在该集群，添加进去
      const existingIndex = clusters.value.findIndex((c) => c.id === id)
      if (existingIndex === -1) {
        clusters.value.push(response)
      } else {
        // 如果已存在，更新它
        clusters.value[existingIndex] = response
      }

      return response
    } catch (error) {
      console.error('Failed to fetch cluster:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createCluster = async (clusterData: CreateClusterRequest) => {
    loading.value = true
    try {
      const response = await clusterApi.createCluster(clusterData)
      clusters.value.unshift(response)
      total.value += 1
      ElMessage.success('Cluster created successfully')
      return response
    } catch (error) {
      console.error('Failed to create cluster:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateCluster = async (id: string, clusterData: UpdateClusterRequest) => {
    loading.value = true
    try {
      const response = await clusterApi.updateCluster(id, clusterData)
      const index = clusters.value.findIndex((cluster) => cluster.id === id)
      if (index !== -1) {
        clusters.value[index] = response
      }
      if (currentCluster.value?.id === id) {
        currentCluster.value = response
      }
      ElMessage.success('Cluster updated successfully')
      return response
    } catch (error) {
      console.error('Failed to update cluster:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const enableCluster = async (id: string) => {
    try {
      await clusterApi.enableCluster(id)
      const cluster = clusters.value.find((c) => c.id === id)
      if (cluster) {
        cluster.status = 'active'
      }
      ElMessage.success('Cluster enabled successfully')
    } catch (error) {
      console.error('Failed to enable cluster:', error)
      throw error
    }
  }

  const disableCluster = async (id: string) => {
    try {
      await clusterApi.disableCluster(id)
      const cluster = clusters.value.find((c) => c.id === id)
      if (cluster) {
        cluster.status = 'disabled'
      }
      ElMessage.success('Cluster disabled successfully')
    } catch (error) {
      console.error('Failed to disable cluster:', error)
      throw error
    }
  }

  const testClusterConnection = async (id: string): Promise<ClusterTestResult> => {
    try {
      const result = await clusterApi.testClusterConnection(id)
      if (result.status === 'success') {
        ElMessage.success('Cluster connection test successful')
      } else {
        ElMessage.error(`Cluster connection test failed: ${result.error}`)
      }
      return result
    } catch (error) {
      console.error('Failed to test cluster connection:', error)
      throw error
    }
  }

  return {
    clusters,
    currentCluster,
    loading,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchClusters,
    fetchCluster,
    createCluster,
    updateCluster,
    enableCluster,
    disableCluster,
    testClusterConnection,
  }
})

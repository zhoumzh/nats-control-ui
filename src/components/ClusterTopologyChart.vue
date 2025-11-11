<template>
  <div class="topology-chart">
    <svg ref="svgContainer" :width="svgWidth" :height="svgHeight" class="topology-svg">
      <!-- Background grid -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="1" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Connection lines -->
      <g class="connections">
        <line
          v-for="connection in visualConnections"
          :key="`${connection.from.id}-${connection.to.id}`"
          :x1="connection.from.x"
          :y1="connection.from.y"
          :x2="connection.to.x"
          :y2="connection.to.y"
          :stroke="getConnectionColor(connection.status)"
          :stroke-width="getConnectionWidth(connection.status)"
          stroke-dasharray="0"
          class="connection-line"
        />

        <!-- Connection arrows -->
        <polygon
          v-for="connection in visualConnections"
          :key="`arrow-${connection.from.id}-${connection.to.id}`"
          :points="getArrowPoints(connection)"
          :fill="getConnectionColor(connection.status)"
          class="connection-arrow"
        />
      </g>

      <!-- Cluster nodes -->
      <g class="nodes">
        <g
          v-for="node in visualNodes"
          :key="node.id"
          class="cluster-node"
          :class="{ isolated: node.status === 'isolated' }"
        >
          <!-- Node circle -->
          <circle
            :cx="node.x"
            :cy="node.y"
            :r="nodeRadius"
            :fill="getNodeColor(node.status)"
            :stroke="getNodeBorderColor(node.status)"
            :stroke-width="3"
            class="node-circle"
          />

          <!-- Node icon -->
          <text
            :x="node.x"
            :y="node.y + 5"
            text-anchor="middle"
            class="node-icon"
            :fill="getNodeTextColor(node.status)"
          >
            🖥️
          </text>

          <!-- Node label -->
          <text :x="node.x" :y="node.y + nodeRadius + 20" text-anchor="middle" class="node-label">
            {{ node.name }}
          </text>

          <!-- Connection count badge -->
          <circle
            v-if="node.connectionCount > 0"
            :cx="node.x + nodeRadius - 5"
            :cy="node.y - nodeRadius + 5"
            r="12"
            fill="#409eff"
            class="connection-badge"
          />
          <text
            v-if="node.connectionCount > 0"
            :x="node.x + nodeRadius - 5"
            :y="node.y - nodeRadius + 10"
            text-anchor="middle"
            class="connection-count"
            fill="white"
            font-size="10"
          >
            {{ node.connectionCount }}
          </text>
        </g>
      </g>

      <!-- 内置图例 -->
      <g class="legend" transform="translate(20, 20)">
        <!-- 图例背景 -->
        <rect
          x="0"
          y="0"
          width="140"
          height="75"
          fill="white"
          stroke="#e4e7ed"
          stroke-width="1"
          rx="6"
          opacity="0.95"
        />

        <!-- 已组网集群图例 -->
        <circle cx="15" cy="20" r="6" fill="#67c23a" stroke="#529b2e" stroke-width="2" />
        <text x="28" y="25" font-size="11" fill="#606266">已组网集群</text>

        <!-- 孤立集群图例 -->
        <circle cx="15" cy="40" r="6" fill="#f56c6c" stroke="#c45656" stroke-width="2" />
        <text x="28" y="45" font-size="11" fill="#606266">孤立集群</text>

        <!-- Gateway连接图例 -->
        <line x1="10" y1="60" x2="25" y2="60" stroke="#409eff" stroke-width="2" />
        <polygon points="25,60 21,57 21,63" fill="#409eff" />
        <text x="28" y="65" font-size="11" fill="#606266">Gateway连接</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { ClusterTopologyResponse, ClusterTopologyNode, ClusterConnection } from '@/types'

interface Props {
  topologyData: ClusterTopologyResponse | null
}

const props = defineProps<Props>()

const svgContainer = ref<SVGElement>()
const svgWidth = ref(800)
const svgHeight = ref(600)
const nodeRadius = 30

interface VisualNode {
  id: string
  name: string
  x: number
  y: number
  status: 'connected' | 'isolated'
  connectionCount: number
  data: ClusterTopologyNode
}

interface VisualConnection {
  from: { id: string; x: number; y: number }
  to: { id: string; x: number; y: number }
  status: string
  data: ClusterConnection
}

// Compute visual nodes with positions
const visualNodes = computed<VisualNode[]>(() => {
  if (!props.topologyData) return []

  const allNodes: ClusterTopologyNode[] = []

  // Collect all nodes from super cluster groups
  props.topologyData.super_cluster_groups.forEach((group) => {
    allNodes.push(...group.clusters)
  })

  // Add isolated clusters
  allNodes.push(...props.topologyData.isolated_clusters)

  // Calculate positions using a simple circle layout for connected clusters
  // and separate positions for isolated ones
  const nodes: VisualNode[] = []
  const centerX = svgWidth.value / 2
  const centerY = svgHeight.value / 2

  // Position connected clusters in groups
  let groupStartAngle = 0
  props.topologyData.super_cluster_groups.forEach((group, groupIndex) => {
    const groupSize = group.clusters.length
    const groupRadius = Math.min(120 + groupSize * 20, 200)
    const angleStep = (Math.PI * 2) / groupSize

    group.clusters.forEach((cluster, index) => {
      const angle = groupStartAngle + index * angleStep
      const x = centerX + Math.cos(angle) * groupRadius
      const y = centerY + Math.sin(angle) * groupRadius

      nodes.push({
        id: cluster.cluster_id,
        name: cluster.cluster_name,
        x,
        y,
        status: 'connected',
        connectionCount: cluster.incoming_connections.length + cluster.outgoing_connections.length,
        data: cluster,
      })
    })

    groupStartAngle += (Math.PI * 2) / props.topologyData.super_cluster_groups.length
  })

  // Position isolated clusters at the bottom
  const isolatedStartX = centerX - (props.topologyData.isolated_clusters.length * 100) / 2
  props.topologyData.isolated_clusters.forEach((cluster, index) => {
    nodes.push({
      id: cluster.cluster_id,
      name: cluster.cluster_name,
      x: isolatedStartX + index * 100,
      y: svgHeight.value - 100,
      status: 'isolated',
      connectionCount: 0,
      data: cluster,
    })
  })

  return nodes
})

// Compute visual connections
const visualConnections = computed<VisualConnection[]>(() => {
  if (!props.topologyData) return []

  const connections: VisualConnection[] = []
  const nodeMap = new Map<string, VisualNode>()

  visualNodes.value.forEach((node) => {
    nodeMap.set(node.id, node)
  })

  // Collect all connections from super cluster groups
  props.topologyData.super_cluster_groups.forEach((group) => {
    group.connections.forEach((conn) => {
      const fromNode = nodeMap.get(conn.from_cluster_id)
      const toNode = nodeMap.get(conn.to_cluster_id)

      if (fromNode && toNode) {
        connections.push({
          from: { id: fromNode.id, x: fromNode.x, y: fromNode.y },
          to: { id: toNode.id, x: toNode.x, y: toNode.y },
          status: conn.status,
          data: conn,
        })
      }
    })
  })

  return connections
})

// Style functions
const getNodeColor = (status: string) => {
  switch (status) {
    case 'connected':
      return '#67c23a'
    case 'isolated':
      return '#f56c6c'
    default:
      return '#909399'
  }
}

const getNodeBorderColor = (status: string) => {
  switch (status) {
    case 'connected':
      return '#529b2e'
    case 'isolated':
      return '#c45656'
    default:
      return '#73767a'
  }
}

const getNodeTextColor = (status: string) => {
  return 'white'
}

const getConnectionColor = (status: string) => {
  return '#409eff'
}

const getConnectionWidth = (status: string) => {
  return 2
}

// Calculate arrow points for connection direction
const getArrowPoints = (connection: VisualConnection) => {
  const dx = connection.to.x - connection.from.x
  const dy = connection.to.y - connection.from.y
  const length = Math.sqrt(dx * dx + dy * dy)

  // Normalize direction
  const unitX = dx / length
  const unitY = dy / length

  // Position arrow at edge of target node
  const arrowX = connection.to.x - unitX * (nodeRadius + 5)
  const arrowY = connection.to.y - unitY * (nodeRadius + 5)

  // Calculate arrow points
  const arrowSize = 8
  const perpX = -unitY * arrowSize
  const perpY = unitX * arrowSize

  const point1X = arrowX - unitX * arrowSize + perpX
  const point1Y = arrowY - unitY * arrowSize + perpY
  const point2X = arrowX - unitX * arrowSize - perpX
  const point2Y = arrowY - unitY * arrowSize - perpY

  return `${arrowX},${arrowY} ${point1X},${point1Y} ${point2X},${point2Y}`
}

onMounted(() => {
  nextTick(() => {
    if (svgContainer.value) {
      const container = svgContainer.value.parentElement
      if (container) {
        svgWidth.value = Math.min(container.clientWidth - 24, 800)
        svgHeight.value = Math.min(500, svgWidth.value * 0.65)
      }
    }
  })
})
</script>

<style scoped lang="scss">
.topology-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  margin-bottom: 16px;
}

.topology-svg {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: #fafafa;
  width: 100%;
  height: auto;
}

.connection-line {
  transition: stroke-width 0.2s ease;

  &:hover {
    stroke-width: 4;
  }
}

.connection-arrow {
  transition: opacity 0.2s ease;
}

.cluster-node {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    .node-circle {
      transform: scale(1.1);
      transform-origin: center;
    }
  }

  &.isolated {
    opacity: 0.7;
  }
}

.node-circle {
  transition: all 0.2s ease;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
}

.node-icon {
  font-size: 20px;
  pointer-events: none;
}

.node-label {
  font-size: 12px;
  font-weight: 500;
  fill: var(--el-text-color-primary);
  pointer-events: none;
}

.connection-badge {
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));
}

.connection-count {
  font-weight: bold;
  pointer-events: none;
}

.legend {
  pointer-events: none;
}
</style>

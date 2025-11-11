import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layouts/Layout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: {
            title: '仪表板',
            icon: 'DataBoard',
          },
        },
        {
          path: 'clusters',
          name: 'Clusters',
          component: () => import('@/views/clusters/ClusterList.vue'),
          meta: {
            title: '集群管理',
            icon: 'Monitor',
          },
        },
        {
          path: 'clusters/create',
          name: 'CreateCluster',
          component: () => import('@/views/clusters/ClusterForm.vue'),
          meta: {
            title: '创建集群',
            hidden: true,
          },
        },
        {
          path: 'clusters/:id/edit',
          name: 'EditCluster',
          component: () => import('@/views/clusters/ClusterForm.vue'),
          meta: {
            title: '编辑集群',
            hidden: true,
          },
        },
        {
          path: 'clusters/:id/detail',
          name: 'ClusterDetail',
          component: () => import('@/views/clusters/ClusterDetail.vue'),
          meta: {
            title: '集群详情',
            hidden: true,
          },
        },
        {
          path: 'clusters/monitoring',
          name: 'ClusterMonitoring',
          component: () => import('@/views/clusters/ClusterMonitoring.vue'),
          meta: {
            title: '集群监控',
            hidden: true,
          },
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('@/views/accounts/AccountList.vue'),
          meta: {
            title: '账户管理',
            icon: 'User',
          },
        },
        {
          path: 'accounts/create',
          name: 'CreateAccount',
          component: () => import('@/views/accounts/AccountForm.vue'),
          meta: {
            title: '创建账户',
            hidden: true,
          },
        },
        {
          path: 'accounts/:id/edit',
          name: 'EditAccount',
          component: () => import('@/views/accounts/AccountForm.vue'),
          meta: {
            title: '编辑账户',
            hidden: true,
          },
        },
        {
          path: 'accounts/:id',
          name: 'AccountDetail',
          component: () => import('@/views/accounts/AccountDetail.vue'),
          meta: {
            title: '账户详情',
            hidden: true,
          },
        },
        {
          path: 'accounts/:accountId/users',
          name: 'AccountUsers',
          component: () => import('@/views/users/UserList.vue'),
          meta: {
            title: '账户用户',
            hidden: true,
          },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/UserList.vue'),
          meta: {
            title: '用户管理',
            icon: 'Avatar',
          },
        },
        {
          path: 'users/create',
          name: 'CreateUser',
          component: () => import('@/views/users/UserForm.vue'),
          meta: {
            title: '创建用户',
            hidden: true,
          },
        },
        {
          path: 'users/:id/edit',
          name: 'EditUser',
          component: () => import('@/views/users/UserForm.vue'),
          meta: {
            title: '编辑用户',
            hidden: true,
          },
        },
        {
          path: 'users/:id',
          name: 'UserDetail',
          component: () => import('@/views/users/UserDetail.vue'),
          meta: {
            title: '用户详情',
            hidden: true,
          },
        },
        {
          path: 'jwt-tasks',
          name: 'JWTTasks',
          component: () => import('@/views/jwt-tasks/JWTTaskList.vue'),
          meta: {
            title: 'JWT任务',
            icon: 'DocumentChecked',
          },
        },
        {
          path: 'jwt-tasks/:id',
          name: 'JWTTaskDetail',
          component: () => import('@/views/jwt-tasks/JWTTaskDetail.vue'),
          meta: {
            title: 'JWT任务详情',
            hidden: true,
          },
        },
        {
          path: 'jetstreams',
          name: 'JetStreams',
          component: () => import('@/views/jetstreams/JetStreamList.vue'),
          meta: {
            title: 'JetStream管理',
            icon: 'Files',
          },
        },
        {
          path: 'jetstreams/create',
          name: 'CreateJetStream',
          component: () => import('@/views/jetstreams/JetStreamForm.vue'),
          meta: {
            title: '创建JetStream',
            hidden: true,
          },
        },
        {
          path: 'jetstreams/:id/edit',
          name: 'JetStreamEdit',
          component: () => import('@/views/jetstreams/JetStreamForm.vue'),
          meta: {
            title: '编辑JetStream',
            hidden: true,
          },
        },
        {
          path: 'jetstreams/:id',
          name: 'JetStreamDetail',
          component: () => import('@/views/jetstreams/JetStreamDetail.vue'),
          meta: {
            title: 'JetStream详情',
            hidden: true,
          },
        },
        {
          path: 'consumers',
          name: 'Consumers',
          component: () => import('@/views/consumers/ConsumerList.vue'),
          meta: {
            title: 'Consumer管理',
            icon: 'Connection',
          },
        },
        {
          path: 'consumers/create',
          name: 'CreateConsumer',
          component: () => import('@/views/consumers/ConsumerForm.vue'),
          meta: {
            title: '创建Consumer',
            hidden: true,
          },
        },
        {
          path: 'consumers/:id/edit',
          name: 'ConsumerEdit',
          component: () => import('@/views/consumers/ConsumerForm.vue'),
          meta: {
            title: '编辑Consumer',
            hidden: true,
          },
        },
        {
          path: 'consumers/:id',
          name: 'ConsumerDetail',
          component: () => import('@/views/consumers/ConsumerDetail.vue'),
          meta: {
            title: 'Consumer详情',
            hidden: true,
          },
        },
      ],
    },
  ],
})

export default router

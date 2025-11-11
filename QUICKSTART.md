# Quick Fix Guide

## 问题解决步骤

### 1. 启动项目
```bash
cd /Users/zhoumingzhu/projects/nats-rbac-ui
./dev-start.sh
```

### 2. 如果还有TypeScript配置问题，手动操作：

```bash
# 安装依赖
npm install

# 如果遇到TypeScript错误，可以尝试：
npm install --save-dev @tsconfig/node18

# 或者跳过类型检查直接启动：
npm run dev -- --force
```

### 3. 如果还有问题，可以使用最小配置启动：

编辑 `tsconfig.json`，简化配置：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. 启动后访问
- UI: http://localhost:3000
- 确保你的API在 http://localhost:8080 运行

### 5. 主要功能
✅ Dashboard - 系统概览  
✅ Account Management - 账户管理  
✅ User Management - 用户管理  
✅ JWT Tasks - 任务监控  

## 故障排除

如果遇到编译错误：
1. 删除 `node_modules` 和 `package-lock.json`
2. 重新运行 `npm install`
3. 使用 `npm run dev` 启动

如果API连接失败：
1. 检查 `.env.local` 中的API地址
2. 确保Go API服务正在运行
3. 检查端口是否被占用

## 特性说明

这个UI完全匹配你的Go API，提供：
- 完整的CRUD操作
- 实时状态更新
- 错误处理
- 深色主题支持
- 响应式设计
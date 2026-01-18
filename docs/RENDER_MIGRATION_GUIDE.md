# 迁移到 Render 完整指南

## 🎯 为什么只用 Render？

### ✅ 优势
1. **统一管理**：前后端在一个平台，配置更简单
2. **同数据中心**：前后端在同一区域，API 调用延迟更低
3. **成本可控**：服务型计费，预算更可预测
4. **持久化支持**：支持数据库、Redis 等
5. **长任务支持**：支持长时间运行的请求（最长 100 分钟）

### ⚠️ 注意事项
1. **免费版休眠**：不活跃时会休眠，首次访问有冷启动延迟（~30秒）
2. **CDN 性能**：Vercel 的全球 CDN 和边缘优化更成熟
3. **Next.js 优化**：Vercel 对 Next.js 的自动优化更好

### 📊 性能对比

| 场景 | Render | Vercel |
|------|--------|--------|
| **首次访问（冷启动）** | 较慢（30秒+） | 快（<1秒） |
| **后续访问** | 快 | 很快 |
| **API 调用延迟** | 低（同数据中心） | 中等（跨平台） |
| **静态资源** | 好 | 优秀（全球 CDN） |
| **管理复杂度** | 低（统一平台） | 中等（多平台） |

## 🚀 迁移步骤

### 1. 更新 `render.yaml` 配置

在项目根目录创建/更新 `render.yaml`：

```yaml
services:
  # 后端服务（已存在）
  - type: web
    name: solbot-backend
    runtime: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && PYTHONPATH=$PYTHONPATH:$(pwd)/.. python -m uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: CLAUDE_MODEL
        value: claude-sonnet-4-20250514
      - key: USE_MEMORY_DB
        value: true
      - key: ENABLE_WARMUP
        value: true
      - key: SERVICE_URL
        fromService:
          type: web
          name: solbot-backend
          property: url
      - key: PING_INTERVAL
        value: 600

  # 前端服务（新增）
  - type: web
    name: solbot-frontend
    runtime: node
    buildCommand: npm install --legacy-peer-deps && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: BACKEND_URL
        fromService:
          type: web
          name: solbot-backend
          property: url
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false  # 需要手动设置
      - key: SUPABASE_SERVICE_KEY
        sync: false  # 需要手动设置
      - key: DATABASE_ENABLED
        value: true
      - key: PORT
        value: 3000
```

### 2. 更新 `package.json` 启动脚本

确保 `package.json` 中有正确的启动命令：

```json
{
  "scripts": {
    "dev": "next dev -p 3004",
    "build": "next build",
    "start": "next start -p $PORT",  // 使用 Render 的 PORT 环境变量
    "lint": "next lint"
  }
}
```

### 3. 更新 `next.config.mjs`

移除 Vercel 特定的配置，简化 rewrites：

```javascript
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['cdn.anthropic.com', 'placehold.co'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 移除 rewrites，因为前后端在同一平台
  // 或者保留，指向 Render 后端 URL
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ]
  },
}
```

### 4. 在 Render Dashboard 配置

#### 4.1 创建前端服务
1. 访问 https://render.com/
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库
4. 配置：
   - **Name**: `solbot-frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

#### 4.2 设置环境变量
在 Render Dashboard 中为前端服务添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `BACKEND_URL` | `https://solbot-backend.onrender.com` | 后端 URL（或使用 fromService） |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase URL |
| `SUPABASE_SERVICE_KEY` | `xxx` | Supabase Service Key |
| `DATABASE_ENABLED` | `true` | 启用数据库 |

#### 4.3 配置自动部署
- 确保 GitHub 仓库已连接
- 选择分支：`main`
- 自动部署：启用

### 5. 处理冷启动问题（可选）

#### 方案 A：使用 Render Cron Job 保持活跃
创建 `render-cron.yaml`：

```yaml
services:
  - type: cron
    name: keep-frontend-alive
    schedule: "*/5 * * * *"  # 每 5 分钟
    buildCommand: echo "No build needed"
    startCommand: curl https://solbot-frontend.onrender.com
```

#### 方案 B：升级到付费计划
- Starter Plan ($7/月)：无休眠、更快启动
- 适合生产环境使用

### 6. 更新 CORS 配置

确保后端允许前端域名访问：

```python
# backend/main.py
from fastAPI.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://solbot-frontend.onrender.com",
        "http://localhost:3004",  # 本地开发
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 迁移检查清单

- [ ] 更新 `render.yaml` 添加前端服务
- [ ] 更新 `package.json` 启动脚本
- [ ] 更新 `next.config.mjs` 配置
- [ ] 在 Render Dashboard 创建前端服务
- [ ] 配置环境变量
- [ ] 更新后端 CORS 配置
- [ ] 测试前后端连接
- [ ] 配置域名（可选）
- [ ] 设置监控和日志

## 🔍 测试步骤

1. **本地测试**：
   ```bash
   npm run build
   npm start
   ```

2. **检查 Render 部署**：
   - 查看构建日志
   - 检查服务状态
   - 测试前端 URL

3. **测试 API 连接**：
   - 打开前端页面
   - 测试聊天功能
   - 检查浏览器控制台错误

## ⚠️ 常见问题

### Q: 前端访问很慢？
A: 可能是冷启动。考虑：
- 使用 Cron Job 保持活跃
- 升级到付费计划
- 添加健康检查端点

### Q: API 调用失败？
A: 检查：
- `BACKEND_URL` 环境变量是否正确
- CORS 配置是否允许前端域名
- 后端服务是否正常运行

### Q: 构建失败？
A: 检查：
- Node 版本（Render 默认 Node 18+）
- 构建日志中的错误信息
- `package.json` 依赖是否正确

## 🎉 迁移完成后的优势

1. ✅ **统一管理**：一个平台管理前后端
2. ✅ **简化配置**：减少跨平台配置复杂度
3. ✅ **降低延迟**：同数据中心 API 调用更快
4. ✅ **成本可控**：服务型计费更可预测
5. ✅ **易于扩展**：添加数据库、Redis 等更容易

## 📚 参考资源

- [Render Next.js 部署文档](https://render.com/docs/deploy-nextjs)
- [Render 环境变量配置](https://render.com/docs/environment-variables)
- [Render 服务间通信](https://render.com/docs/service-communication)

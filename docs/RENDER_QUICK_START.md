# Render 快速部署指南（只用 Render）

## 🚀 快速开始

### 1. 准备工作

确保你已经：
- ✅ 有 Render.com 账户
- ✅ GitHub 仓库已连接
- ✅ 后端服务已在 Render 运行

### 2. 部署前端到 Render

#### 方法 A：使用 render.yaml（推荐）

1. **确保 `render.yaml` 在项目根目录**
   ```bash
   ls render.yaml  # 应该能看到文件
   ```

2. **在 Render Dashboard 创建新服务**
   - 访问 https://render.com/
   - 点击 "New +" → "Blueprint"
   - 选择你的 GitHub 仓库
   - Render 会自动检测 `render.yaml` 并创建两个服务

#### 方法 B：手动创建前端服务

1. **创建 Web Service**
   - 访问 https://render.com/
   - 点击 "New +" → "Web Service"
   - 连接 GitHub 仓库

2. **配置服务**
   - **Name**: `solbot-frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **设置环境变量**
   在 Render Dashboard → Environment 标签添加：

   | Key | Value | 说明 |
   |-----|-------|------|
   | `NODE_ENV` | `production` | 必需 |
   | `BACKEND_URL` | `https://solbot-backend.onrender.com` | 后端 URL |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | 你的 Supabase URL |
   | `SUPABASE_SERVICE_KEY` | `xxx` | 你的 Supabase Service Key |
   | `DATABASE_ENABLED` | `true` | 启用数据库 |

4. **保存并部署**
   - 点击 "Create Web Service"
   - 等待构建完成（约 5-10 分钟）

### 3. 测试部署

1. **检查前端 URL**
   - Render 会提供类似 `https://solbot-frontend.onrender.com` 的 URL
   - 访问该 URL 测试

2. **测试功能**
   - 打开页面
   - 测试聊天功能
   - 检查浏览器控制台是否有错误

### 4. 处理冷启动（可选）

Render 免费版会在不活跃时休眠，首次访问需要 30-60 秒启动。

**解决方案**：

#### 方案 A：使用 Cron Job 保持活跃
创建 `render-cron.yaml`：

```yaml
services:
  - type: cron
    name: keep-frontend-alive
    schedule: "*/5 * * * *"  # 每 5 分钟
    buildCommand: echo "No build needed"
    startCommand: curl https://solbot-frontend.onrender.com
```

#### 方案 B：升级到 Starter Plan（$7/月）
- 无休眠
- 更快启动
- 适合生产环境

## 📊 性能对比

| 指标 | Render | Vercel |
|------|--------|--------|
| **首次访问** | 30-60秒（冷启动） | <1秒 |
| **后续访问** | 快 | 很快 |
| **API 延迟** | 低（同数据中心） | 中等 |
| **管理** | 简单（统一平台） | 中等 |

## ✅ 优势总结

1. ✅ **统一管理**：前后端在一个平台
2. ✅ **配置简单**：减少跨平台复杂度
3. ✅ **API 延迟低**：同数据中心调用更快
4. ✅ **成本可控**：服务型计费更可预测

## ⚠️ 注意事项

1. **冷启动**：免费版会休眠，首次访问较慢
2. **CDN**：Vercel 的全球 CDN 更成熟
3. **Next.js 优化**：Vercel 对 Next.js 的优化更好

## 🔧 故障排除

### 构建失败
- 检查 Node 版本（需要 18+）
- 查看构建日志
- 确保 `package.json` 依赖正确

### API 连接失败
- 检查 `BACKEND_URL` 环境变量
- 确认后端服务正常运行
- 检查 CORS 配置

### 页面加载慢
- 可能是冷启动（首次访问）
- 考虑升级到付费计划
- 使用 Cron Job 保持活跃

## 📚 下一步

- 配置自定义域名（可选）
- 设置监控和告警
- 优化构建时间
- 考虑升级到付费计划

# Render Pro 完整迁移指南

## 🎯 迁移目标

将所有服务从 Vercel + Render 迁移到 **只用 Render（Pro 订阅）**，实现：
- ✅ 统一平台管理
- ✅ 无休眠（Pro 订阅）
- ✅ 更快的 API 调用（同数据中心）
- ✅ 简化的配置管理

## 📋 迁移前检查清单

### 1. 确认 Render Pro 订阅
- [ ] 已激活 Render Pro 订阅
- [ ] 账户有足够的配额

### 2. 准备环境变量
需要准备以下值：
- [ ] `ANTHROPIC_API_KEY` - Anthropic API 密钥
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- [ ] `SUPABASE_SERVICE_KEY` - Supabase Service Key

### 3. 检查现有服务
- [ ] 后端服务 `solbot-backend` 已在 Render 运行
- [ ] 确认后端 URL（如：`https://solbot-backend.onrender.com`）

## 🚀 迁移步骤

### 步骤 1：使用 Blueprint 部署（推荐）

#### 1.1 在 Render Dashboard 创建 Blueprint

1. 访问 https://render.com/
2. 点击 **"New +"** → **"Blueprint"**
3. 选择你的 GitHub 仓库：`SiruiruiRen/sol2l-bot`
4. Render 会自动检测 `render.yaml` 并创建两个服务：
   - `solbot-backend`（如果不存在）
   - `solbot-frontend`（新建）

#### 1.2 配置环境变量

在创建服务后，需要为前端服务设置环境变量：

**在 Render Dashboard → `solbot-frontend` → Environment**：

| Key | Value | 说明 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | `xxx` | Supabase Service Key |
| `SUPABASE_URL` | `https://xxx.supabase.co` | 与上面相同（用于 API 路由） |

**后端服务**（如果还没有设置）：
| Key | Value | 说明 |
|-----|-------|------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-xxx` | Anthropic API 密钥 |

### 步骤 2：手动创建前端服务（如果 Blueprint 不可用）

#### 2.1 创建 Web Service

1. 访问 https://render.com/
2. 点击 **"New +"** → **"Web Service"**
3. 连接 GitHub 仓库：`SiruiruiRen/sol2l-bot`

#### 2.2 配置服务设置

- **Name**: `solbot-frontend`
- **Runtime**: `Node`
- **Region**: 选择与后端相同的区域（推荐）
- **Branch**: `main`
- **Root Directory**: `/`（项目根目录）
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Starter`（Pro 订阅）

#### 2.3 设置环境变量

在 **Environment** 标签添加：

```env
NODE_ENV=production
BACKEND_URL=https://solbot-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
DATABASE_ENABLED=true
PORT=3000
```

**注意**：`BACKEND_URL` 会自动从 `render.yaml` 的 `fromService` 配置中获取，但也可以手动设置。

### 步骤 3：等待部署完成

1. 点击 **"Create Web Service"**
2. 等待构建完成（约 5-10 分钟）
3. 查看构建日志，确保没有错误

### 步骤 4：测试部署

#### 4.1 检查前端 URL

Render 会提供类似 `https://solbot-frontend.onrender.com` 的 URL。

#### 4.2 功能测试

1. **访问前端页面**
   - 打开前端 URL
   - 检查页面是否正常加载

2. **测试聊天功能**
   - 尝试发送消息
   - 检查是否收到 AI 回复
   - 查看浏览器控制台是否有错误

3. **测试其他功能**
   - 视频播放
   - 表单提交
   - 数据分析

#### 4.3 检查后端连接

```bash
# 测试后端健康检查
curl https://solbot-backend.onrender.com/health

# 应该返回：
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### 步骤 5：更新 CORS 配置（如果需要）

后端 CORS 已配置为允许所有来源（`"*"`），但如果需要更严格的配置：

在 `backend/main.py` 中更新 `origins` 列表：

```python
origins = [
    "https://solbot-frontend.onrender.com",  # Render 前端
    "http://localhost:3004",                  # 本地开发
    # ... 其他域名
]
```

### 步骤 6：配置自定义域名（可选）

1. 在 Render Dashboard → `solbot-frontend` → **Settings**
2. 找到 **"Custom Domains"**
3. 添加你的域名（如：`solbot.yourdomain.com`）
4. 按照提示配置 DNS

## ✅ 迁移后验证

### 检查清单

- [ ] 前端页面正常加载
- [ ] 聊天功能正常工作
- [ ] API 调用成功（检查浏览器 Network 标签）
- [ ] 数据库连接正常（如果使用）
- [ ] 所有功能测试通过
- [ ] 日志中没有错误

### 性能检查

- [ ] 首次访问速度快（Pro 订阅无冷启动）
- [ ] API 响应时间正常
- [ ] 页面加载流畅

## 🔧 故障排除

### 问题 1：构建失败

**症状**：构建日志显示错误

**解决方法**：
1. 检查 Node 版本（需要 18+）
2. 查看构建日志中的具体错误
3. 确保 `package.json` 依赖正确
4. 检查 `render.yaml` 配置是否正确

### 问题 2：API 连接失败

**症状**：前端无法连接到后端

**解决方法**：
1. 检查 `BACKEND_URL` 环境变量是否正确
2. 确认后端服务正在运行
3. 检查 CORS 配置
4. 查看浏览器控制台和 Render 日志

### 问题 3：环境变量未生效

**症状**：功能异常，可能是环境变量问题

**解决方法**：
1. 在 Render Dashboard 检查环境变量
2. 确保变量名正确（区分大小写）
3. 重新部署服务（修改环境变量后需要重新部署）

### 问题 4：Supabase 连接失败

**症状**：数据库相关功能不工作

**解决方法**：
1. 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`
2. 确认 Supabase 项目正常运行
3. 检查 Supabase 项目的网络访问设置

## 📊 迁移前后对比

| 项目 | 迁移前（Vercel + Render） | 迁移后（只用 Render） |
|------|-------------------------|----------------------|
| **平台数量** | 2 个平台 | 1 个平台 |
| **配置复杂度** | 中等（跨平台） | 低（统一平台） |
| **API 延迟** | 中等（跨平台调用） | 低（同数据中心） |
| **管理** | 需要在两个平台管理 | 只需一个平台 |
| **成本** | Vercel Pro + Render | 只需 Render Pro |
| **冷启动** | Vercel 无，Render 有（免费版） | Pro 订阅无冷启动 |

## 🎉 迁移完成

迁移完成后，你可以：

1. **停止 Vercel 部署**（可选）
   - 在 Vercel Dashboard 中暂停或删除项目
   - 或者保留作为备份

2. **更新文档**
   - 更新部署文档
   - 更新 README 中的部署说明

3. **监控服务**
   - 在 Render Dashboard 设置监控和告警
   - 定期检查日志

## 📚 参考资源

- [Render Next.js 部署文档](https://render.com/docs/deploy-nextjs)
- [Render 环境变量配置](https://render.com/docs/environment-variables)
- [Render 服务间通信](https://render.com/docs/service-communication)
- [Render Pro 订阅详情](https://render.com/pricing)

## 🔄 回滚方案（如果需要）

如果迁移后出现问题，可以：

1. **保留 Vercel 部署**作为备份
2. **在 Render Dashboard 暂停前端服务**
3. **恢复 Vercel 部署**
4. **检查问题并修复后重新迁移**

---

**需要帮助？** 检查 Render Dashboard 的日志或联系 Render 支持。

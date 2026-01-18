# 部署状态检查和问题解决指南

## 🎯 应该使用哪个网站？

### ✅ **使用 Render**（推荐）

**当前状态**：
- ✅ 前端已部署：`sol2l-bot.onrender.com`（或 `solbot-frontend.onrender.com`）
- ⚠️ 后端需要检查：`solbot-backend.onrender.com`

**为什么用 Render**：
1. ✅ 你已经有了 Render Pro 订阅
2. ✅ 前后端统一管理
3. ✅ 无休眠，性能稳定
4. ✅ 配置已完成

### ❌ **不要用 Vercel**

- 建议暂停 Vercel 部署（见 `docs/VERCEL_DEPLOYMENT_PAUSE.md`）
- 避免收到失败通知
- 节省配额

---

## 🔍 问题诊断：500 错误

### 错误信息
```
POST https://sol2l-bot.onrender.com/api/onboarding 500 (Internal Server Error)
"Failed to create user session"
```

### 可能的原因

1. **后端服务未运行或未正确部署**
2. **后端环境变量未设置**（特别是 Supabase）
3. **后端 URL 配置错误**
4. **Supabase 连接失败**

---

## ✅ 检查清单

### 1. 检查后端服务状态

**在 Render Dashboard**：
1. 访问 https://render.com/
2. 进入 `solbot-backend` 服务
3. 检查：
   - [ ] 服务状态是否为 **"Live"**
   - [ ] 最近的部署是否成功
   - [ ] Logs 中是否有错误信息

**测试后端健康检查**：
```bash
curl https://solbot-backend.onrender.com/health
```

应该返回：
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### 2. 检查后端环境变量

**在 Render Dashboard → `solbot-backend` → Environment**：

| 变量名 | 必需 | 检查 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | 必须设置，格式：`sk-ant-api03-xxx` |
| `CLAUDE_MODEL` | ✅ | 应该是：`claude-sonnet-4-5` |
| `USE_MEMORY_DB` | ✅ | 应该是：`true` |
| `SUPABASE_URL` | ⚠️ | 如果使用 Supabase，必须设置 |
| `SUPABASE_SERVICE_KEY` | ⚠️ | 如果使用 Supabase，必须设置 |

### 3. 检查前端环境变量

**在 Render Dashboard → `solbot-frontend` → Environment**：

| 变量名 | 必需 | 检查 |
|--------|------|------|
| `BACKEND_URL` | ✅ | 应该是：`https://solbot-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ | 如果使用 Supabase，必须设置 |
| `SUPABASE_SERVICE_KEY` | ⚠️ | 如果使用 Supabase，必须设置 |
| `SUPABASE_URL` | ⚠️ | 如果使用 Supabase，必须设置（与上面相同） |

### 4. 检查后端日志

**在 Render Dashboard → `solbot-backend` → Logs**：

查找以下错误：
- ❌ `ANTHROPIC_API_KEY not found`
- ❌ `Supabase connection failed`
- ❌ `Database error`
- ❌ `Failed to create user session`

---

## 🔧 解决方案

### 方案 1：后端未运行

**症状**：后端服务状态不是 "Live"

**解决**：
1. 在 Render Dashboard 检查后端服务
2. 如果有错误，查看 Logs
3. 重新部署或修复错误

### 方案 2：环境变量未设置

**症状**：后端日志显示 "ANTHROPIC_API_KEY not found" 或类似错误

**解决**：
1. 在 Render Dashboard → `solbot-backend` → Environment
2. 添加缺失的环境变量
3. 保存并重新部署

### 方案 3：Supabase 连接失败

**症状**：后端日志显示 Supabase 相关错误

**解决**：
1. 检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正确
2. 确认 Supabase 项目正常运行
3. 检查 Supabase 项目的网络访问设置

### 方案 4：后端 URL 配置错误

**症状**：前端无法连接到后端

**解决**：
1. 检查前端 `BACKEND_URL` 环境变量
2. 确认后端服务 URL 正确
3. 检查 `next.config.mjs` 中的 rewrites 配置

---

## 🧪 测试步骤

### 1. 测试后端连接

```bash
# 测试健康检查
curl https://solbot-backend.onrender.com/health

# 测试 API 端点（需要正确的请求体）
curl -X POST https://solbot-backend.onrender.com/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","profile_data":{}}'
```

### 2. 测试前端到后端连接

1. 打开浏览器开发者工具（F12）
2. 进入 Network 标签
3. 尝试提交表单
4. 查看 `/api/onboarding` 请求：
   - 请求 URL 是否正确
   - 响应状态码
   - 响应内容

### 3. 检查 Claude 连接

**在后端日志中查找**：
- ✅ `Using Claude model: claude-sonnet-4-5`
- ✅ `Anthropic client initialized`
- ❌ `ANTHROPIC_API_KEY not found`
- ❌ `Error initializing Anthropic client`

---

## 📋 快速修复步骤

### 步骤 1：检查后端服务

1. 访问 Render Dashboard
2. 检查 `solbot-backend` 服务状态
3. 查看最近的 Logs

### 步骤 2：检查环境变量

1. 后端：确保 `ANTHROPIC_API_KEY` 已设置
2. 前端：确保 `BACKEND_URL` 正确
3. 如果使用 Supabase：确保所有 Supabase 变量已设置

### 步骤 3：重新部署

1. 如果修改了环境变量，重新部署服务
2. 等待部署完成
3. 测试功能

---

## 🎯 下一步

1. **检查后端服务状态**
2. **检查环境变量**
3. **查看后端日志**
4. **测试连接**
5. **修复问题**

---

**需要帮助？** 告诉我你检查的结果，我可以帮你进一步诊断！

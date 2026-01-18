# Render 环境变量检查清单

## 🔍 后端服务 (solbot-backend)

### 必需的环境变量

| 变量名 | 当前值 | 应该的值 | 说明 |
|--------|--------|----------|------|
| `ANTHROPIC_API_KEY` | ✅ 已设置 | `sk-ant-api03-xxx` | Claude API 密钥（敏感信息） |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | `claude-sonnet-4.5-20250514` 或 `claude-3-7-sonnet-20250219` | Claude 模型版本 |
| `USE_MEMORY_DB` | `true` | `true` | 使用内存数据库 |
| `ENABLE_WARMUP` | `false` | `false` | Pro 订阅不需要（不会休眠） |
| `SERVICE_URL` | `https://solbot-backend.onrender.com` | ✅ 正确 | 服务 URL |
| `PING_INTERVAL` | `600` | `600` | Ping 间隔（秒） |
| `PORT` | `10000` | ✅ 自动设置 | Render 自动设置 |

### ⚠️ 需要检查的设置

1. **CLAUDE_MODEL**: 
   - 当前：`claude-sonnet-4-20250514` (这是 Sonnet 4.5)
   - 如果需要最新版本，可以更新为：`claude-3-7-sonnet-20250219` 或 `claude-sonnet-4.5-20250514`
   - **注意**：需要在 Render Dashboard 手动更新

2. **DATABASE_ENABLED**: 
   - 如果使用 Supabase，应该设置为 `true`
   - 如果只使用内存数据库，保持 `false` 或 `true`（不影响）

---

## 🎨 前端服务 (solbot-frontend)

### 必需的环境变量

| 变量名 | 当前状态 | 应该的值 | 说明 |
|--------|----------|----------|------|
| `NODE_ENV` | ✅ 已设置 | `production` | 生产环境 |
| `BACKEND_URL` | ✅ 已设置 | `https://solbot-backend.onrender.com` | 后端服务 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ 需要更新 | `https://新项目.supabase.co` | **需要手动更新为新 Supabase URL** |
| `SUPABASE_SERVICE_KEY` | ⚠️ 需要更新 | `新项目的service_key` | **需要手动更新为新 Supabase Key** |
| `SUPABASE_URL` | ⚠️ 需要更新 | `https://新项目.supabase.co` | **需要手动更新（与上面相同）** |
| `DATABASE_ENABLED` | ✅ 已设置 | `true` | 启用数据库 |

### ⚠️ 重要：Supabase 环境变量更新

**当前问题**：环境变量链接到了旧的 Supabase 项目

**解决步骤**：

1. **获取新的 Supabase 信息**：
   - 访问 https://app.supabase.com/
   - 选择**新的 Supabase 项目**
   - 进入 **Settings** → **API**
   - 复制：
     - **Project URL** → 用于 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_URL`
     - **service_role key** → 用于 `SUPABASE_SERVICE_KEY`

2. **在 Render Dashboard 更新**：
   - 进入 `solbot-frontend` 服务
   - 点击 **"Environment"** 标签
   - 找到以下变量并更新：
     - `NEXT_PUBLIC_SUPABASE_URL` → 新的 Supabase URL
     - `SUPABASE_SERVICE_KEY` → 新的 Service Key
     - `SUPABASE_URL` → 新的 Supabase URL（与上面相同）

3. **保存并重新部署**：
   - 点击 **"Save Changes"**
   - 服务会自动重新部署
   - 等待部署完成（约 5-10 分钟）

---

## 🔧 如何更新环境变量

### 在 Render Dashboard：

1. 进入服务页面（`solbot-backend` 或 `solbot-frontend`）
2. 点击左侧菜单 **"Environment"**
3. 找到要更新的变量
4. 点击变量右侧的 **"Edit"** 按钮
5. 输入新值
6. 点击 **"Save Changes"**
7. 服务会自动重新部署

---

## ✅ 检查清单

### 后端检查
- [ ] `ANTHROPIC_API_KEY` 已设置且有效
- [ ] `CLAUDE_MODEL` 已更新为 Sonnet 4.5（如果需要）
- [ ] `ENABLE_WARMUP` 设置为 `false`（Pro 订阅）
- [ ] `SERVICE_URL` 正确指向后端服务

### 前端检查
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已更新为新 Supabase 项目
- [ ] `SUPABASE_SERVICE_KEY` 已更新为新 Supabase 项目的 key
- [ ] `SUPABASE_URL` 已更新为新 Supabase 项目（与上面相同）
- [ ] `BACKEND_URL` 正确指向后端服务
- [ ] `DATABASE_ENABLED` 设置为 `true`

---

## 🚨 常见问题

### Q: 如何确认 Supabase 环境变量是否正确？

A: 
1. 检查 Supabase Dashboard 中的项目 URL
2. 确保 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_URL` 完全相同
3. 确保 `SUPABASE_SERVICE_KEY` 是 `service_role` key（不是 `anon` key）

### Q: 更新环境变量后需要做什么？

A: 
- Render 会自动重新部署服务
- 等待部署完成（查看 Logs 标签）
- 测试功能是否正常工作

### Q: 如何验证 Claude 模型版本？

A:
1. 查看后端日志（Render Dashboard → solbot-backend → Logs）
2. 查找 "Using Claude model: ..." 日志
3. 或测试一个 API 调用，查看响应中的模型信息

---

**提示**：保存此清单，定期检查环境变量是否正确配置。

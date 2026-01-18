# Render 环境变量更新指南

## 🎯 需要更新的内容

### 1. 后端服务 (solbot-backend) - Claude 模型更新

**当前配置**：
- `CLAUDE_MODEL`: `claude-sonnet-4-20250514` ✅ (这就是 Sonnet 4.5)

**说明**：
- `claude-sonnet-4-20250514` 实际上就是 **Claude Sonnet 4.5**
- 这是当前最新的稳定版本
- 如果 Render Dashboard 中显示不同的值，需要更新

**更新步骤**：
1. 进入 Render Dashboard → `solbot-backend` → **Environment**
2. 找到 `CLAUDE_MODEL` 变量
3. 确保值为：`claude-sonnet-4-20250514`
4. 点击 **"Save Changes"**
5. 服务会自动重新部署

---

### 2. 前端服务 (solbot-frontend) - Supabase 更新

**问题**：当前环境变量链接到了旧的 Supabase 项目

**需要更新的变量**：
- `NEXT_PUBLIC_SUPABASE_URL` → 新 Supabase 项目 URL
- `SUPABASE_SERVICE_KEY` → 新 Supabase 项目的 service_role key
- `SUPABASE_URL` → 新 Supabase 项目 URL（与上面相同）

**更新步骤**：

#### 步骤 1：获取新的 Supabase 信息

1. 访问 https://app.supabase.com/
2. 选择**新的 Supabase 项目**（不是旧的）
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → 例如：`https://xxxxx.supabase.co`
   - **service_role key** → 以 `eyJ...` 开头的长字符串（⚠️ 这是敏感信息）

#### 步骤 2：在 Render Dashboard 更新

1. 进入 Render Dashboard → `solbot-frontend` → **Environment**
2. 找到并更新以下变量：

   **变量 1：NEXT_PUBLIC_SUPABASE_URL**
   - 点击 **"Edit"** 按钮
   - 输入新的 Supabase Project URL
   - 例如：`https://xxxxx.supabase.co`
   - 点击 **"Save"**

   **变量 2：SUPABASE_SERVICE_KEY**
   - 点击 **"Edit"** 按钮
   - 输入新的 service_role key
   - 例如：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - 点击 **"Save"**

   **变量 3：SUPABASE_URL**
   - 点击 **"Edit"** 按钮
   - 输入与 `NEXT_PUBLIC_SUPABASE_URL` **完全相同**的值
   - 例如：`https://xxxxx.supabase.co`
   - 点击 **"Save"**

3. 点击页面底部的 **"Save Changes"**
4. 服务会自动重新部署（约 5-10 分钟）

---

## ✅ 完整检查清单

### 后端服务 (solbot-backend)

- [ ] `ANTHROPIC_API_KEY` - 已设置且有效
- [ ] `CLAUDE_MODEL` - 设置为 `claude-sonnet-4-20250514` (Sonnet 4.5)
- [ ] `USE_MEMORY_DB` - 设置为 `true`
- [ ] `ENABLE_WARMUP` - 设置为 `false` (Pro 订阅不需要)
- [ ] `SERVICE_URL` - 设置为 `https://solbot-backend.onrender.com`
- [ ] `PING_INTERVAL` - 设置为 `600`

### 前端服务 (solbot-frontend)

- [ ] `NODE_ENV` - 设置为 `production`
- [ ] `BACKEND_URL` - 设置为 `https://solbot-backend.onrender.com`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - **已更新为新 Supabase 项目 URL**
- [ ] `SUPABASE_SERVICE_KEY` - **已更新为新 Supabase 项目的 service_role key**
- [ ] `SUPABASE_URL` - **已更新为新 Supabase 项目 URL**（与上面相同）
- [ ] `DATABASE_ENABLED` - 设置为 `true`

---

## 🔍 验证更新

### 验证 Supabase 连接

1. **检查前端日志**：
   - Render Dashboard → `solbot-frontend` → **Logs**
   - 查找 "Supabase client initialized" 或类似消息
   - 不应该有 Supabase 连接错误

2. **测试功能**：
   - 访问前端 URL
   - 测试需要数据库的功能（如用户数据保存）
   - 检查是否连接到新的 Supabase 项目

### 验证 Claude 模型

1. **检查后端日志**：
   - Render Dashboard → `solbot-backend` → **Logs**
   - 查找 "Using Claude model: claude-sonnet-4-20250514"
   - 确认模型名称正确

2. **测试 API**：
   - 发送一个测试请求
   - 检查响应中的模型信息

---

## ⚠️ 重要提示

1. **Supabase Key 类型**：
   - 确保使用的是 **service_role key**，不是 `anon` key
   - `service_role key` 有完整权限，用于服务端 API
   - `anon key` 只有有限权限，用于客户端

2. **环境变量一致性**：
   - `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_URL` 必须**完全相同**
   - 它们指向同一个 Supabase 项目

3. **更新后重新部署**：
   - 更新环境变量后，Render 会自动重新部署
   - 等待部署完成后再测试
   - 查看 Logs 确认没有错误

4. **备份旧配置**：
   - 在更新前，可以截图保存旧的 Supabase 配置
   - 以防需要回滚

---

## 🚨 常见问题

### Q: 如何确认 Supabase 环境变量已更新？

A: 
1. 在 Render Dashboard 查看 Environment 变量
2. 确认值已更改
3. 检查前端日志，确认连接到新的 Supabase 项目

### Q: 更新后功能不工作？

A:
1. 检查 Logs 中的错误信息
2. 确认 Supabase URL 和 Key 都正确
3. 确认新 Supabase 项目中有正确的数据库表结构
4. 检查 CORS 设置（如果需要）

### Q: 如何确认使用的是 Sonnet 4.5？

A:
1. 查看后端日志中的 "Using Claude model: ..." 消息
2. 或测试 API 调用，查看响应中的模型信息

---

**完成更新后，请测试所有功能确保正常工作！**

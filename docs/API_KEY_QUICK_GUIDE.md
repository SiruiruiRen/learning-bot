# API 密钥快速配置指南

## 🎯 你需要配置 API 密钥的位置

### 1. **本地开发** - `.env` 文件（项目根目录）

**位置**: `/Users/sirui/Desktop/sol2l-bot/.env`

**需要添加的变量**：
```env
ANTHROPIC_API_KEY=sk-ant-api03-你的密钥
BACKEND_URL=http://localhost:8081
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_KEY=你的supabase-service-key
DATABASE_ENABLED=true
```

**如何编辑**：
```bash
# 方法1: 使用文本编辑器
open .env

# 方法2: 使用命令行
nano .env
# 或
code .env  # 如果使用 VS Code
```

---

### 2. **后端部署** - Render.com Dashboard

**步骤**：
1. 访问 https://render.com/
2. 登录并选择 `solbot-backend` 服务
3. 点击左侧菜单 **"Environment"**
4. 点击 **"Add Environment Variable"**
5. 添加：
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-你的密钥`
   - 点击 **"Save Changes"**

**重要**：保存后需要重新部署服务才会生效。

---

### 3. **前端部署** - Vercel Dashboard

**步骤**：
1. 访问 https://vercel.com/dashboard
2. 选择项目 `sol2l-bot`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

| Key | Value | 环境 |
|-----|-------|------|
| `BACKEND_URL` | `https://sol-bot-backend.onrender.com` | Production, Preview, Development |
| `SUPABASE_URL` | `https://你的项目.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | `你的supabase-service-key` | Production, Preview, Development |
| `DATABASE_ENABLED` | `true` | Production, Preview, Development |

**注意**：前端不需要 `ANTHROPIC_API_KEY`，因为 API 调用通过后端进行。

---

## 🔍 如何检查配置是否正确

### 检查本地配置
```bash
cd /Users/sirui/Desktop/sol2l-bot

# 检查 .env 文件是否存在
ls -la .env

# 检查变量是否设置（不显示完整值）
grep "^ANTHROPIC_API_KEY" .env && echo "✅ ANTHROPIC_API_KEY 已设置" || echo "❌ ANTHROPIC_API_KEY 未设置"
```

### 检查后端是否正常工作
```bash
# 测试后端连接
curl https://sol-bot-backend.onrender.com/health

# 如果返回 JSON，说明后端正常
```

---

## 📝 快速设置步骤

### 第一次设置（本地开发）

1. **创建/编辑 `.env` 文件**：
   ```bash
   cd /Users/sirui/Desktop/sol2l-bot
   nano .env
   ```

2. **添加以下内容**：
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-你的密钥
   BACKEND_URL=http://localhost:8081
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
   SUPABASE_SERVICE_KEY=你的supabase-service-key
   DATABASE_ENABLED=true
   ```

3. **保存文件**（在 nano 中：`Ctrl+X` → `Y` → `Enter`）

4. **重启开发服务器**（如果正在运行）

---

## ⚠️ 常见错误

### 错误：`ANTHROPIC_API_KEY not found`
- **原因**：环境变量未设置或名称错误
- **解决**：确保变量名是 `ANTHROPIC_API_KEY`（不是 `CLAUDE_API_KEY`）

### 错误：500 Internal Server Error
- **原因1**：后端未运行或 Render 服务休眠
- **解决**：检查 Render Dashboard，确保服务在线

- **原因2**：API 密钥无效或过期
- **解决**：在 Anthropic Console 生成新密钥并更新

### 错误：Cannot connect to backend
- **原因**：`BACKEND_URL` 配置错误
- **解决**：检查 Vercel 环境变量中的 `BACKEND_URL` 是否正确

---

## 🔐 获取 API 密钥

### Anthropic API 密钥
1. 访问：https://console.anthropic.com/
2. 登录账户
3. 进入 **API Keys**
4. 点击 **"Create Key"**
5. 复制密钥（格式：`sk-ant-api03-...`）

### Supabase 密钥
1. 访问：https://app.supabase.com/
2. 选择项目
3. **Settings** → **API**
4. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

---

## ✅ 配置检查清单

- [ ] `.env` 文件在项目根目录
- [ ] `ANTHROPIC_API_KEY` 已设置（本地）
- [ ] Render 后端环境变量已配置
- [ ] Vercel 前端环境变量已配置
- [ ] 后端服务正在运行
- [ ] API 密钥格式正确（以 `sk-ant-api03-` 开头）

---

**提示**：如果你已经有 `.env` 文件，只需要确保 `ANTHROPIC_API_KEY` 已正确设置即可！

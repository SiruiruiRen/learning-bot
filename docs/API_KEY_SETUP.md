# API 密钥配置指南

## 📍 API 密钥需要配置的位置

根据你的部署方式，API 密钥需要在不同的地方配置：

---

## 1. 本地开发环境

### 创建 `.env` 文件

在项目**根目录**（`/Users/sirui/Desktop/sol2l-bot/`）创建 `.env` 文件：

```bash
# 在项目根目录
cd /Users/sirui/Desktop/sol2l-bot
touch .env
```

### `.env` 文件内容

```env
# Anthropic Claude API 密钥
ANTHROPIC_API_KEY=sk-ant-api03-你的密钥

# Claude 模型（可选，默认已配置）
CLAUDE_MODEL=claude-sonnet-4-20250514

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_KEY=你的supabase-service-key

# 后端URL（本地开发时）
BACKEND_URL=http://localhost:8081

# 数据库启用状态
DATABASE_ENABLED=true
```

### ⚠️ 重要提示
- `.env` 文件**不要**提交到 Git（已在 `.gitignore` 中）
- 确保 `.env` 文件在项目根目录，不在 `backend/` 或 `app/` 子目录

---

## 2. 后端部署（Render.com）

### 在 Render Dashboard 配置

1. 登录 [Render.com](https://render.com/)
2. 进入你的 `solbot-backend` 服务
3. 点击 **"Environment"** 标签
4. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-你的密钥` | **必须设置**，Claude API密钥 |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | 可选，模型版本 |
| `USE_MEMORY_DB` | `true` | 数据库模式 |
| `ENABLE_WARMUP` | `true` | 启用预热 |

### 或者使用 `render.yaml` 配置

如果你使用 `backend/render.yaml`，API密钥需要在 Render Dashboard 中手动设置（`sync: false` 表示需要手动输入）。

---

## 3. 前端部署（Vercel）

### 在 Vercel Dashboard 配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 `sol2l-bot`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `BACKEND_URL` | `https://sol-bot-backend.onrender.com` | Production, Preview, Development |
| `SUPABASE_URL` | `https://你的项目.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | `你的supabase-service-key` | Production, Preview, Development |
| `DATABASE_ENABLED` | `true` | Production, Preview, Development |

**注意**：前端不需要直接配置 `ANTHROPIC_API_KEY`，因为 API 调用是通过后端进行的。

---

## 4. 获取 API 密钥

### Anthropic API 密钥

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 登录你的账户
3. 进入 **API Keys** 页面
4. 点击 **"Create Key"**
5. 复制生成的密钥（格式：`sk-ant-api03-...`）

### Supabase 密钥

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`（⚠️ 保密，不要暴露给前端）

---

## 5. 验证配置

### 检查后端是否正常工作

```bash
# 检查后端健康状态
curl https://sol-bot-backend.onrender.com/health
```

### 检查环境变量

**本地开发**：
```bash
# 在项目根目录
cd /Users/sirui/Desktop/sol2l-bot

# 检查 .env 文件是否存在
ls -la .env

# 查看环境变量（不要显示完整密钥）
grep ANTHROPIC_API_KEY .env | cut -d'=' -f1
```

**后端（Render）**：
- 在 Render Dashboard 的 Environment 页面查看
- 确保 `ANTHROPIC_API_KEY` 已设置且不为空

**前端（Vercel）**：
- 在 Vercel Dashboard 的 Environment Variables 页面查看
- 确保 `BACKEND_URL` 指向正确的后端地址

---

## 6. 常见问题

### ❌ 问题：500 错误，API 无法连接

**可能原因**：
1. `ANTHROPIC_API_KEY` 未设置或错误
2. 后端服务未运行
3. `BACKEND_URL` 配置错误

**解决方法**：
1. 检查 Render Dashboard 中的环境变量
2. 检查后端服务是否在线（Render 免费版会在不活跃时休眠）
3. 验证 `BACKEND_URL` 是否正确

### ❌ 问题：本地开发时 API 调用失败

**可能原因**：
1. `.env` 文件不存在或位置错误
2. 环境变量名称错误（必须是 `ANTHROPIC_API_KEY`）
3. 后端未启动

**解决方法**：
1. 确保 `.env` 文件在项目根目录
2. 检查变量名是否正确
3. 启动后端：`cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8081`

### ❌ 问题：Supabase 数据未记录

**可能原因**：
1. `SUPABASE_SERVICE_KEY` 未设置
2. `DATABASE_ENABLED` 设置为 `false`
3. Supabase 表结构未创建

**解决方法**：
1. 检查 Vercel 环境变量
2. 确保 `DATABASE_ENABLED=true`
3. 运行数据库迁移脚本

---

## 7. 安全最佳实践

✅ **DO（应该做）**：
- 使用环境变量存储密钥
- 将 `.env` 添加到 `.gitignore`
- 在部署平台使用环境变量配置
- 定期轮换 API 密钥

❌ **DON'T（不要做）**：
- 不要将 API 密钥提交到 Git
- 不要在前端代码中硬编码密钥
- 不要将密钥分享给他人
- 不要使用生产密钥进行本地测试（如果可能）

---

## 8. 快速检查清单

- [ ] 本地 `.env` 文件已创建并配置
- [ ] Render 后端环境变量已设置（`ANTHROPIC_API_KEY`）
- [ ] Vercel 前端环境变量已设置（`BACKEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`）
- [ ] 后端服务正在运行
- [ ] API 密钥格式正确（以 `sk-ant-api03-` 开头）
- [ ] Supabase 表结构已创建

---

**最后更新**: 2025-01-XX  
**相关文件**: `backend/utils/llm.py`, `backend/render.yaml`, `.env.example`（如果存在）

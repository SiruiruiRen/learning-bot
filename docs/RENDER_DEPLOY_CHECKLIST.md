# Render 部署检查清单（Pro 订阅）

## ✅ 部署前准备

### 1. 环境变量准备
- [ ] `ANTHROPIC_API_KEY` - 已准备好
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - 已准备好
- [ ] `SUPABASE_SERVICE_KEY` - 已准备好

### 2. 代码检查
- [ ] `render.yaml` 已更新（包含前后端服务）
- [ ] `package.json` start 脚本支持 PORT 环境变量
- [ ] `next.config.mjs` 使用环境变量而不是硬编码 URL
- [ ] 所有代码已提交到 GitHub main 分支

## 🚀 部署步骤

### 步骤 1：使用 Blueprint 部署（推荐）

1. [ ] 访问 https://render.com/
2. [ ] 点击 **"New +"** → **"Blueprint"**
3. [ ] 选择 GitHub 仓库：`SiruiruiRen/sol2l-bot`
4. [ ] 点击 **"Apply"**
5. [ ] Render 会自动创建两个服务：
   - `solbot-backend`（如果不存在）
   - `solbot-frontend`（新建）

### 步骤 2：配置环境变量

#### 后端服务（如果还没有设置）
在 `solbot-backend` → **Environment**：
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-api03-xxx`

#### 前端服务
在 `solbot-frontend` → **Environment**：
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xxx.supabase.co`
- [ ] `SUPABASE_SERVICE_KEY` = `xxx`
- [ ] `SUPABASE_URL` = `https://xxx.supabase.co`（与上面相同）

**注意**：`BACKEND_URL` 会自动从 `render.yaml` 配置中获取，无需手动设置。

### 步骤 3：等待部署

- [ ] 后端构建完成（约 3-5 分钟）
- [ ] 前端构建完成（约 5-10 分钟）
- [ ] 检查构建日志，确保没有错误

### 步骤 4：测试

- [ ] 访问前端 URL（如：`https://solbot-frontend.onrender.com`）
- [ ] 页面正常加载
- [ ] 测试聊天功能
- [ ] 检查浏览器控制台无错误
- [ ] 测试其他功能（视频、表单等）

## 🔍 验证清单

### 功能测试
- [ ] 首页加载正常
- [ ] 导航菜单工作正常
- [ ] 聊天功能正常
- [ ] AI 回复正常
- [ ] 视频播放正常
- [ ] 表单提交正常
- [ ] 数据分析正常

### 技术检查
- [ ] 后端健康检查：`curl https://solbot-backend.onrender.com/health`
- [ ] API 调用成功（检查浏览器 Network 标签）
- [ ] 数据库连接正常（如果使用）
- [ ] 日志中没有错误

## ⚠️ 常见问题

### 构建失败
- 检查 Node 版本（需要 18+）
- 查看构建日志
- 确保依赖正确安装

### API 连接失败
- 检查 `BACKEND_URL` 环境变量
- 确认后端服务运行中
- 检查 CORS 配置

### 环境变量未生效
- 确认变量名正确（区分大小写）
- 重新部署服务
- 检查 Render Dashboard 中的环境变量

## 📝 部署后操作

- [ ] 更新文档中的部署 URL
- [ ] 设置监控和告警（可选）
- [ ] 配置自定义域名（可选）
- [ ] 停止 Vercel 部署（可选）

## 🎉 完成！

部署完成后，所有服务都在 Render 上运行，享受：
- ✅ 统一平台管理
- ✅ 无休眠（Pro 订阅）
- ✅ 更快的 API 调用
- ✅ 简化的配置

---

**需要帮助？** 查看 `docs/RENDER_PRO_MIGRATION.md` 获取详细指南。

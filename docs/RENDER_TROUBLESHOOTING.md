# Render 部署故障排除指南

## 🔍 常见部署失败原因

### 1. 环境变量缺失

**症状**：构建失败，错误信息包含 "undefined" 或 "missing"

**解决方法**：
- 在 Render Dashboard → `solbot-frontend` → **Environment**
- 确保以下变量已设置：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `SUPABASE_URL`

### 2. 构建命令失败

**症状**：构建日志显示 npm install 或 npm run build 失败

**可能原因**：
- Node.js 版本不兼容
- 依赖冲突
- 内存不足

**解决方法**：
1. 检查构建日志中的具体错误
2. 确保使用 Node.js 18+ 版本
3. 在 `package.json` 中添加 `engines` 字段：

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 3. 启动命令失败

**症状**：构建成功但服务无法启动

**可能原因**：
- PORT 环境变量问题
- 启动命令格式错误

**解决方法**：
- 确保 `package.json` 中的 start 脚本正确
- Render 会自动设置 `PORT` 环境变量

### 4. Next.js 构建错误

**症状**：`npm run build` 失败

**可能原因**：
- TypeScript 错误
- ESLint 错误
- 缺少环境变量

**解决方法**：
- 检查 `next.config.mjs` 中的配置
- 确保 `ignoreBuildErrors: true` 和 `ignoreDuringBuilds: true` 已设置

## 📋 检查清单

在查看构建日志前，确认：

- [ ] 所有必需的环境变量已设置
- [ ] Node.js 版本兼容（18+）
- [ ] `package.json` 中的脚本正确
- [ ] `render.yaml` 配置正确
- [ ] GitHub 仓库已正确连接

## 🔧 快速修复步骤

### 步骤 1：查看构建日志

1. 在 Render Dashboard → `solbot-frontend`
2. 点击 **"Logs"** 标签
3. 查看最新的构建日志
4. 找到错误信息（通常在最后几行）

### 步骤 2：根据错误信息修复

#### 错误：`NEXT_PUBLIC_SUPABASE_URL is not defined`
**修复**：在 Environment 中添加 `NEXT_PUBLIC_SUPABASE_URL`

#### 错误：`Cannot find module`
**修复**：检查 `package.json` 依赖，确保所有依赖都已安装

#### 错误：`Port already in use` 或 `EADDRINUSE`
**修复**：确保使用 `$PORT` 环境变量，不要硬编码端口

#### 错误：`Build failed` 或 `TypeScript errors`
**修复**：检查 `next.config.mjs` 中的 `ignoreBuildErrors: true`

### 步骤 3：重新部署

1. 修复问题后
2. 在 Render Dashboard 点击 **"Manual Deploy"** → **"Deploy latest commit"**
3. 或推送新的 commit 到 GitHub（如果启用了自动部署）

## 🐛 特定错误解决方案

### 错误：`npm ERR! peer dep missing`

**原因**：依赖版本冲突

**解决**：
```bash
# 在 render.yaml 中确保使用 --legacy-peer-deps
buildCommand: npm install --legacy-peer-deps && npm run build
```

### 错误：`Module not found: Can't resolve`

**原因**：缺少依赖或路径错误

**解决**：
1. 检查 `package.json` 中是否包含该依赖
2. 确保导入路径正确
3. 重新运行 `npm install`

### 错误：`ENOENT: no such file or directory`

**原因**：文件路径错误或文件不存在

**解决**：
1. 检查文件路径是否正确
2. 确保所有必需的文件都已提交到 GitHub
3. 检查 `.gitignore` 是否意外排除了必需文件

### 错误：`Out of memory` 或构建超时

**原因**：构建过程消耗过多资源

**解决**：
1. 优化构建过程
2. 考虑升级到更大的实例
3. 减少构建时的依赖安装

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看完整构建日志**
   - Render Dashboard → 服务 → Logs
   - 复制完整的错误信息

2. **检查 GitHub Issues**
   - 查看是否有类似问题

3. **联系 Render 支持**
   - 提供构建日志和错误信息

## 🔄 回滚到工作版本

如果新部署失败，可以：

1. 在 Render Dashboard → 服务 → **Deploys**
2. 找到之前成功的部署
3. 点击 **"Redeploy"**

## ✅ 成功部署的标志

部署成功后，你应该看到：

- ✅ 构建日志显示 "Build successful"
- ✅ 服务状态显示 "Live"
- ✅ 可以访问前端 URL
- ✅ 页面正常加载
- ✅ 功能正常工作

---

**提示**：保存构建日志，以便后续排查问题。

# Supabase 表设置指南

## 🚨 问题：缺少 `user_data` 表

**错误信息**：
```
Could not find the table 'public.user_data' in the schema cache
```

**原因**：Supabase 数据库中缺少 `user_data` 表。

---

## ✅ 解决方案

### 步骤 1：在 Supabase Dashboard 执行 SQL

1. **访问 Supabase Dashboard**
   - 打开 https://app.supabase.com/
   - 选择你的项目

2. **打开 SQL Editor**
   - 点击左侧菜单的 **"SQL Editor"**
   - 点击 **"New query"**

3. **复制并执行 SQL 脚本**
   - 打开文件：`database/create_user_data_table.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **"Run"** 或按 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **验证表已创建**
   - 在 SQL Editor 中运行：
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_data';
   ```
   - 应该返回一行：`user_data`

### 步骤 2：检查表结构

在 SQL Editor 中运行：

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_data' 
ORDER BY ordinal_position;
```

应该看到以下列：
- `id` (uuid)
- `user_id` (uuid)
- `data_type` (text)
- `value` (text)
- `metadata` (jsonb)
- `created_at` (timestamp with time zone)

### 步骤 3：刷新 Schema Cache（重要！）

执行 SQL 脚本后，Supabase 会自动刷新 schema cache。如果表仍然不可用，手动刷新：

1. 在 SQL Editor 中运行：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. 或者：
   - 进入 **Settings** → **API**
   - 点击 **"Reload Schema"** 按钮

### 步骤 4：测试 API

1. **测试表是否可访问**
   - 在 Supabase Dashboard → **Table Editor**
   - 应该能看到 `user_data` 表

2. **测试 API 端点**
   - 在浏览器中访问：
   ```
   https://你的项目.supabase.co/rest/v1/user_data
   ```
   - 应该返回空数组 `[]`（如果没有数据）

---

## 📋 完整的表结构

### `users` 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### `user_data` 表
```sql
CREATE TABLE user_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);
```

### `sessions` 表
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

---

## 🔍 故障排除

### 问题 1：表创建后仍然报错

**解决**：
1. 刷新 PostgREST schema cache：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
2. 等待几秒钟
3. 重新测试

### 问题 2：外键约束错误

**解决**：
- 确保 `users` 表已创建
- SQL 脚本会自动创建 `users` 表（如果不存在）

### 问题 3：权限错误

**解决**：
- 确保使用 **service_role** key 访问 API
- 检查 Row Level Security (RLS) 设置

---

## ✅ 验证清单

执行 SQL 脚本后，确认：

- [ ] `users` 表已创建
- [ ] `user_data` 表已创建
- [ ] `sessions` 表已创建（如果需要）
- [ ] 索引已创建
- [ ] Schema cache 已刷新
- [ ] API 可以访问表

---

## 🎯 下一步

1. **执行 SQL 脚本**
2. **刷新 Schema Cache**
3. **测试应用功能**
4. **检查日志确认错误消失**

---

**提示**：如果问题仍然存在，检查：
- Supabase 项目 URL 是否正确
- Service Key 是否正确
- 环境变量是否已更新

# 完整数据追踪指南

## 🎯 确保所有用户数据都被记录

本指南确保 Supabase 记录了**所有**用户数据，包括：

1. ✅ 用户轨迹（页面导航、阶段转换）
2. ✅ 用户所有输入的内容（表单、聊天、文本输入）
3. ✅ Click 数据（所有点击，包括 Next 按钮）
4. ✅ 什么时候点击 Next（专门的导航追踪）
5. ✅ 用户和 chatbot 对话的内容（完整对话历史）
6. ✅ Chatbot 的评分和 feedback（评估结果）

---

## 📊 数据库表结构

### 核心表

#### 1. `content_interaction_logs` - 所有交互的主日志
记录所有用户交互：
- 点击事件
- 聊天消息
- 表单输入
- 导航事件
- 视频交互

#### 2. `navigation_events` - 导航追踪（专门追踪 Next 按钮）
记录：
- Next 按钮点击
- Previous 按钮点击
- 阶段转换
- 页面视图
- 在每个页面的停留时间

#### 3. `user_inputs` - 所有用户输入
记录：
- 表单字段输入
- 聊天消息
- 文本区域输入
- 输入框内容
- 提交状态和尝试次数

#### 4. `click_events` - 详细点击数据
记录：
- 点击的元素类型（按钮、链接、其他）
- 元素信息（ID、类名、文本）
- 点击位置（x, y 坐标）
- 按钮文本（特别是 "Next"、"Continue" 等）

#### 5. `chat_conversations` - 聊天对话记录
记录：
- 对话开始/结束时间
- 消息数量（用户和 AI）
- 评估分数
- 反馈内容
- 详细评估元数据

#### 6. `messages` - 所有消息（用户和 AI）
记录：
- 用户消息内容
- AI 回复内容
- 阶段和组件信息
- 消息元数据

#### 7. `assessments` - 评分和反馈
记录：
- 整体分数
- 详细评估（JSONB）
- 反馈内容
- 尝试次数
- 改进轨迹

---

## 🔧 追踪组件

### 1. `ClickTracker` - 通用点击追踪
- 位置：`components/click-tracker.tsx`
- 功能：记录所有页面点击
- 数据：元素信息、位置、时间戳

### 2. `NavigationTracker` - 导航和 Next 按钮追踪
- 位置：`components/navigation-tracker.tsx`
- 功能：
  - 追踪页面视图
  - 专门追踪 Next 按钮点击
  - 记录页面停留时间
  - 追踪阶段转换

### 3. `UserDataTracker` - 用户数据追踪
- 位置：`components/UserDataTracker.jsx`
- 功能：追踪页面视图和会话事件

### 4. Chat 组件 - 对话追踪
所有聊天组件都会记录：
- 用户消息
- AI 回复
- 评估和反馈

---

## 📋 追踪的事件类型

### 点击事件
- `user_click` - 所有点击
- `next_button` - Next 按钮点击（专门追踪）
- `button_click` - 按钮点击

### 导航事件
- `page_view` - 页面视图
- `page_exit` - 页面退出
- `phase_transition` - 阶段转换
- `next_button` - Next 按钮点击

### 输入事件
- `form_input` - 表单输入
- `text_input` - 文本输入
- `chat_message` - 聊天消息

### 聊天事件
- `chat_message` - 聊天消息（用户和 AI）
- `chat_started` - 聊天开始
- `chat_ended` - 聊天结束
- `floating_chat_question` - 浮动聊天问题
- `floating_chat_response` - 浮动聊天回复

### 评估事件
- `revision_submitted` - 提交修订
- `phase_completed` - 阶段完成

---

## 🚀 设置步骤

### 步骤 1：在 Supabase 执行完整 Schema

1. 访问 Supabase Dashboard → SQL Editor
2. 执行 `database/complete_analytics_schema.sql`
3. 这会创建所有必需的表

### 步骤 2：验证表已创建

在 SQL Editor 中运行：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'content_interaction_logs',
  'navigation_events',
  'user_inputs',
  'click_events',
  'chat_conversations',
  'messages',
  'assessments'
)
ORDER BY table_name;
```

应该返回 7 行。

### 步骤 3：刷新 Schema Cache

```sql
NOTIFY pgrst, 'reload schema';
```

---

## ✅ 数据记录检查清单

### 用户轨迹
- [ ] 页面视图被记录（`navigation_events`）
- [ ] 阶段转换被记录（`navigation_events`）
- [ ] 页面停留时间被记录（`navigation_events.time_on_page_seconds`）

### 用户输入
- [ ] 表单输入被记录（`user_inputs`）
- [ ] 聊天消息被记录（`user_inputs` + `messages`）
- [ ] 文本区域输入被记录（`user_inputs`）

### Click 数据
- [ ] 所有点击被记录（`click_events`）
- [ ] Next 按钮点击被记录（`navigation_events` + `click_events`）
- [ ] 点击位置被记录（`click_events.x_position`, `y_position`）

### Next 按钮
- [ ] Next 按钮点击时间被记录（`navigation_events.timestamp`）
- [ ] 点击前页面停留时间被记录（`navigation_events.time_on_page_seconds`）
- [ ] 按钮文本被记录（`navigation_events.button_text`）

### 对话内容
- [ ] 用户消息被记录（`messages` + `user_inputs`）
- [ ] AI 回复被记录（`messages`）
- [ ] 完整对话历史被记录（`chat_conversations`）

### 评分和反馈
- [ ] 评估分数被记录（`assessments.overall_score`）
- [ ] 详细评估被记录（`assessments.evaluation`）
- [ ] 反馈内容被记录（`assessments.feedback_content`）
- [ ] 评估元数据被记录（`chat_conversations.evaluation_metadata`）

---

## 🔍 查询示例

### 查询所有 Next 按钮点击

```sql
SELECT 
  ne.timestamp,
  ne.from_phase,
  ne.to_phase,
  ne.button_text,
  ne.time_on_page_seconds
FROM navigation_events ne
WHERE ne.event_type = 'next_button'
ORDER BY ne.timestamp;
```

### 查询用户所有输入

```sql
SELECT 
  ui.timestamp,
  ui.input_type,
  ui.field_name,
  ui.input_value,
  ui.phase,
  ui.is_submission
FROM user_inputs ui
WHERE ui.user_id = 'your-user-id'
ORDER BY ui.timestamp;
```

### 查询完整对话历史

```sql
SELECT 
  m.timestamp,
  m.role,
  m.content,
  m.phase,
  m.component
FROM messages m
WHERE m.session_id = 'your-session-id'
ORDER BY m.timestamp;
```

### 查询评分和反馈

```sql
SELECT 
  a.timestamp,
  a.phase,
  a.component,
  a.overall_score,
  a.evaluation,
  a.feedback_content,
  a.attempt_number
FROM assessments a
WHERE a.user_id = 'your-user-id'
ORDER BY a.timestamp;
```

---

## 📊 数据分析视图

执行 schema 后，可以使用以下视图：

1. **`user_journey_complete`** - 完整用户旅程概览
2. **`next_button_analysis`** - Next 按钮点击分析
3. **`chat_with_scores`** - 带评分的聊天对话

---

## ⚠️ 重要提示

1. **确保所有表都已创建**
   - 执行 `complete_analytics_schema.sql`
   - 验证表存在

2. **确保组件已集成**
   - `NavigationTracker` 已添加到 `client-layout.tsx`
   - `ClickTracker` 已添加
   - 所有聊天组件都在记录消息

3. **测试数据记录**
   - 执行一些操作（点击、输入、导航）
   - 检查 Supabase 表是否有新记录

4. **定期检查**
   - 查看 `content_interaction_logs` 表
   - 确认数据正在被记录

---

**完成设置后，所有用户数据都会被完整记录！**

# 浮动聊天机器人和增强分析功能文档

## 概述
本文档记录了新增的浮动聊天机器人功能和增强的分析追踪系统。

---

## 1. 浮动弹出式聊天机器人

### 功能描述
在页面右下角添加了一个浮动聊天按钮，学生可以随时点击询问后续问题。

### 实现位置
- **组件**: `components/floating-chatbot.tsx`
- **集成**: `app/client-layout.tsx`

### 功能特性
- ✅ 右下角浮动按钮，点击后弹出聊天窗口
- ✅ 可最小化/最大化窗口
- ✅ 根据当前阶段（Phase）自动显示相关建议问题
- ✅ 支持完整对话功能
- ✅ 所有对话记录到 Supabase

### 阶段特定建议问题

每个阶段都有预设的常见问题：

**Phase 1 (SRL介绍)**:
- "What is self-regulated learning (SRL)?"
- "Can you explain the 4-stage model?"
- "What does metacognition mean?"
- "How does planning relate to learning?"

**Phase 2 (任务分析)**:
- "What is a learning objective?"
- "How do I identify cognitive levels?"
- "What resources should I use?"
- "What is task analysis?"

**Phase 3 (学习策略)**:
- "What is self-testing?"
- "How does spacing work?"
- "What is self-explanation?"
- "What is retrieval practice?"

**Phase 4 (MCII)**:
- "What is MCII?"
- "What is mental contrasting?"
- "What are implementation intentions?"
- "How do I create an if-then plan?"

**Phase 5 (监控)**:
- "What is monitoring?"
- "How do I adapt my strategies?"
- "What is self-assessment?"
- "How do I know if my plan is working?"

---

## 2. 500错误修复

### 问题诊断
- 后端响应格式验证不足
- 错误处理不够健壮
- 缺少对无效响应的检查

### 修复措施
1. **API路由增强** (`app/api/chat/route.ts`):
   - 添加响应格式验证
   - 改进错误消息处理
   - 添加详细的错误日志

2. **前端组件增强**:
   - 所有聊天组件添加错误处理
   - 验证 `result.data` 是否存在
   - 提供用户友好的错误消息

3. **错误恢复机制**:
   - 自动重试功能
   - 清晰的错误提示
   - 保存用户输入以便重试

---

## 3. Claude Sonnet 4.5 更新

### 模型配置
- **当前模型**: `claude-sonnet-4-20250514` (Claude Sonnet 4.5)
- **配置文件**: `backend/utils/llm.py`
- **部署配置**: `backend/render.yaml`

### 确保运行
- ✅ 模型名称已更新
- ✅ 后端配置正确
- ✅ API密钥配置检查

---

## 4. 增强的分析追踪系统

### 追踪的事件类型

#### 4.1 用户点击追踪
- **组件**: `components/click-tracker.tsx`
- **记录内容**:
  - 点击位置 (x, y坐标)
  - 目标元素信息 (标签、ID、类名、文本)
  - 当前页面路径
  - 时间戳

#### 4.2 视频交互追踪
- **组件**: `components/video-player.tsx`
- **记录事件**:
  - `video_play` - 播放
  - `video_pause` - 暂停
  - `video_rewind` - 回退
  - `video_fast_forward` - 快进
  - `video_loaded` - 视频加载
  - `video_progress_milestone` - 进度里程碑 (25%, 50%, 75%, 90%)

**记录的数据**:
- 当前播放时间
- 总观看时长
- 暂停次数
- 回退/快进次数
- 视频标题和阶段

#### 4.3 聊天消息追踪
- **所有聊天组件**:
  - `solbot-chat.tsx`
  - `guided-learning-objective.tsx`
  - `guided-monitoring.tsx`
  - `guided-monitoring-adaptation.tsx`
  - `guided-mcii.tsx`
  - `guided-long-term-goal.tsx`
  - `floating-chatbot.tsx`

**记录内容**:
- 用户消息: 角色、内容、时间戳
- AI回复: 角色、内容、时间戳
- 阶段和组件信息

### Supabase 数据表

#### `content_interaction_logs`
记录所有交互事件：
- `interaction_type`: 事件类型 (user_click, chat_message, video_pause等)
- `content_type`: 内容类型
- `phase`: 当前阶段
- `component`: 组件名称
- `interaction_data`: JSON格式的详细数据

#### `user_video_analytics`
视频分析数据：
- `watched_duration_seconds`: 观看时长
- `pause_count`: 暂停次数
- `rewind_count`: 回退次数
- `fast_forward_count`: 快进次数
- `watch_patterns`: 观看模式JSON数组

#### `user_chat_analytics`
聊天分析数据：
- `chat_start_time`: 聊天开始时间
- `chat_end_time`: 聊天结束时间
- `message_count`: 消息数量
- `total_duration_seconds`: 总时长
- `metadata`: 包含对话内容的JSON

---

## 5. API增强

### `/api/events` 路由更新

新增支持的事件类型：
- `video_pause` / `video_play` / `video_rewind` / `video_fast_forward`
- `floating_chat_question` / `floating_chat_response`
- `chat_message` (用户和AI消息)
- `user_click` (所有点击事件)

### 错误处理改进

- 所有API调用都有错误处理
- 详细的错误日志
- 用户友好的错误消息
- 自动重试机制

---

## 6. 数据记录完整性

### 确保记录的数据

✅ **用户点击**: 所有页面点击都记录到 `content_interaction_logs`
✅ **视频交互**: 播放、暂停、回退、快进都记录到 `user_video_analytics`
✅ **聊天消息**: 所有用户问题和AI回复都记录到 `content_interaction_logs` 和 `user_chat_analytics`
✅ **浮动聊天**: 浮动聊天机器人的所有交互都记录
✅ **阶段信息**: 所有事件都包含阶段和组件信息
✅ **时间戳**: 所有事件都有精确的时间戳

---

## 7. 使用说明

### 浮动聊天机器人
1. 在任意页面（除了landing/intro），右下角会显示聊天图标
2. 点击图标打开聊天窗口
3. 查看建议问题或直接输入问题
4. 点击建议问题可快速发送
5. 可以最小化窗口继续浏览
6. 所有对话自动保存

### 分析数据查看
所有数据都存储在 Supabase 数据库中：
- `content_interaction_logs` - 查看所有交互
- `user_video_analytics` - 查看视频观看数据
- `user_chat_analytics` - 查看聊天数据

---

## 8. 技术细节

### 组件架构
```
app/client-layout.tsx
├── FloatingChatbotWrapper (检测阶段，条件渲染)
├── ClickTracker (全局点击追踪)
└── 其他全局组件
```

### 数据流
```
用户交互 → 事件监听 → /api/events → Supabase
     ↓
前端组件 → /api/chat → 后端API → Claude API
     ↓
响应 → 前端显示 + Supabase日志
```

---

## 9. 未来改进建议

1. **聊天历史**: 在浮动聊天中显示之前的对话历史
2. **更多建议问题**: 根据当前页面内容动态生成建议问题
3. **语音输入**: 支持语音提问
4. **实时分析仪表板**: 为研究人员提供实时数据分析界面

---

**最后更新**: 2025-01-XX  
**相关提交**: `1673ca9`, `935fc56`  
**状态**: ✅ 已完成并测试

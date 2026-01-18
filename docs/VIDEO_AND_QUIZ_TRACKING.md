# 视频和 Quiz 数据追踪指南

## 🎯 视频观看数据追踪

### 记录的数据

#### `user_video_analytics` 表
记录每个视频的总体观看数据：
- `video_name` - 视频名称
- `video_src` - 视频源 URL
- `total_duration_seconds` - 视频总时长
- `watched_duration_seconds` - 实际观看时长
- `completion_percentage` - 完成百分比
- `play_count` - 播放次数
- `pause_count` - 暂停次数
- `rewind_count` - 回退次数
- `fast_forward_count` - 快进次数
- `seek_count` - 总 seek 操作次数
- `watch_patterns` - 观看模式（JSONB）
- `watch_segments` - 观看片段（JSONB）
- `skipped_segments` - 跳过的片段（JSONB）
- `last_position` - 最后观看位置
- `completed_at` - 完成时间
- `first_play_at` - 首次播放时间
- `last_interaction_at` - 最后交互时间

#### `video_interaction_events` 表
记录每个视频交互事件的详细信息：
- `event_type` - 事件类型（play, pause, seek, rewind, fast_forward, progress_milestone, loaded, ended, error）
- `playback_position` - 当前播放位置（秒）（注意：使用 playback_position 而不是 current_time，因为 current_time 是 PostgreSQL 保留关键字）
- `total_watched_seconds` - 累计观看时长
- `event_timestamp` - 事件时间戳
- `metadata` - 额外事件详情（JSONB）

### 追踪的事件类型

- `video_loaded` - 视频加载完成
- `video_play` - 视频播放
- `video_pause` - 视频暂停
- `video_seek` - 视频跳转
- `video_rewind` - 视频回退
- `video_fast_forward` - 视频快进
- `video_progress_milestone` - 进度里程碑（25%, 50%, 75%, 90%）
- `video_ended` - 视频结束
- `video_watch_completed` - 观看完成
- `video_error` - 视频错误

---

## 📝 Quiz 数据追踪

### 记录的数据

#### `knowledge_check_attempts` 表
记录每个问题的详细答案数据：
- `question_id` - 问题 ID
- `question_text` - 问题文本
- `question_type` - 问题类型（multiple_choice, true_false, short_answer）
- `attempt_number` - 尝试次数
- `selected_answer` - 用户选择的答案
- `correct_answer` - 正确答案
- `is_correct` - 是否正确
- `time_to_answer_seconds` - 答题时间（秒）
- `time_to_first_interaction_seconds` - 首次交互时间
- `confidence_level` - 信心水平（1-5）
- `help_used` - 是否使用帮助
- `answer_changed` - 是否更改答案
- `answer_changes` - 答案更改历史（JSONB）
- `thinking_time_seconds` - 思考时间
- `options_shown` - 显示的选项（JSONB）
- `explanation_viewed` - 是否查看解释
- `retry_count` - 重试次数

#### `quiz_session_summary` 表
记录整个 Quiz 会话的总体数据：
- `total_questions` - 总问题数
- `correct_answers` - 正确答案数
- `incorrect_answers` - 错误答案数
- `accuracy_percentage` - 准确率
- `average_time_per_question_seconds` - 平均每题时间
- `total_time_seconds` - 总时间
- `first_attempt_accuracy` - 首次尝试准确率
- `retry_accuracy` - 重试后准确率
- `questions_answered` - 已回答的问题 ID 列表（JSONB）
- `quiz_start_time` - Quiz 开始时间
- `quiz_end_time` - Quiz 结束时间
- `completed` - 是否完成

### 追踪的事件类型

- `quiz_started` - Quiz 开始
- `quiz_question_answered` - 问题已回答
- `quiz_completed` - Quiz 完成

---

## 🔍 查询示例

### 查询用户视频观看数据

```sql
-- 查看用户所有视频观看情况
SELECT 
  phase,
  video_name,
  completion_percentage,
  watched_duration_seconds,
  total_duration_seconds,
  pause_count,
  rewind_count,
  completed_at
FROM user_video_analytics
WHERE user_id = 'your-user-id'
ORDER BY phase, first_play_at;
```

### 查询视频交互事件

```sql
-- 查看视频的所有交互事件
SELECT 
  event_type,
  playback_position,
  total_watched_seconds,
  event_timestamp
FROM video_interaction_events
WHERE session_id = 'your-session-id'
  AND video_name = 'Video Title'
ORDER BY event_timestamp;
```

### 查询 Quiz 答题数据

```sql
-- 查看用户所有 Quiz 答题情况
SELECT 
  phase,
  question_text,
  selected_answer,
  correct_answer,
  is_correct,
  time_to_answer_seconds,
  answer_changed,
  retry_count
FROM knowledge_check_attempts
WHERE user_id = 'your-user-id'
ORDER BY phase, created_at;
```

### 查询 Quiz 总体表现

```sql
-- 查看每个阶段的 Quiz 总体表现
SELECT 
  phase,
  total_questions,
  correct_answers,
  accuracy_percentage,
  total_time_seconds,
  completed
FROM quiz_session_summary
WHERE user_id = 'your-user-id'
ORDER BY phase;
```

### 查询视频和 Quiz 综合数据

```sql
-- 查看阶段完成情况（包含视频和 Quiz）
SELECT 
  pca.phase,
  pca.video_time_seconds,
  pca.quiz_time_seconds,
  pca.quiz_score,
  COUNT(DISTINCT uva.video_name) as videos_watched,
  COUNT(DISTINCT qss.id) as quizzes_completed
FROM phase_completion_analytics pca
LEFT JOIN user_video_analytics uva ON pca.session_id = uva.session_id AND pca.phase = uva.phase
LEFT JOIN quiz_session_summary qss ON pca.session_id = qss.session_id AND pca.phase = qss.phase
WHERE pca.user_id = 'your-user-id'
GROUP BY pca.phase, pca.video_time_seconds, pca.quiz_time_seconds, pca.quiz_score;
```

---

## 📊 数据分析视图

### `video_watching_summary`
视频观看摘要视图，包含：
- 观看时长和完成百分比
- 交互次数统计
- 参与度等级（Complete/Partial/Minimal）

### `quiz_performance_summary`
Quiz 表现摘要视图，包含：
- 准确率和答题时间
- 帮助使用情况
- 答案更改情况

---

## ✅ 检查清单

### 视频数据追踪
- [ ] 视频播放被记录（`video_play`）
- [ ] 视频暂停被记录（`video_pause`）
- [ ] 视频跳转被记录（`video_seek`）
- [ ] 观看时长被记录（`watched_duration_seconds`）
- [ ] 完成百分比被记录（`completion_percentage`）
- [ ] 进度里程碑被记录（25%, 50%, 75%, 90%）
- [ ] 视频结束被记录（`video_ended`）

### Quiz 数据追踪
- [ ] Quiz 开始被记录（`quiz_started`）
- [ ] 每个问题答案被记录（`quiz_question_answered`）
- [ ] 答题时间被记录（`time_to_answer_seconds`）
- [ ] 答案更改被记录（`answer_changes`）
- [ ] 是否正确被记录（`is_correct`）
- [ ] Quiz 完成被记录（`quiz_completed`）
- [ ] 总体准确率被记录（`accuracy_percentage`）

---

## 🔧 组件集成

### VideoPlayer 组件
- 位置：`components/video-player.tsx`
- 自动记录所有视频事件
- 追踪观看时长和交互

### KnowledgeCheck 组件
- 位置：`app/phase2/knowledge-check.tsx`, `app/phase3/knowledge-check.tsx`
- 记录每个问题的答案
- 追踪答题时间和答案更改

---

**所有视频和 Quiz 数据都会被完整记录到 Supabase！**

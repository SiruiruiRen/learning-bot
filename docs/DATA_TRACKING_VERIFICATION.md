# Data Tracking Verification Guide

## Overview
This document verifies that all user interactions are properly tracked and logged to Supabase.

## 1. Click Data Tracking ✅

**Component**: `components/click-tracker.tsx`
**API Endpoint**: `/api/events` with `event_type: 'user_click'`
**Database Tables**:
- `click_events` - Detailed click information
- `content_interaction_logs` - Master log

**What's Tracked**:
- Element tag, id, class, text
- Click position (x, y)
- Pathname
- Phase and component
- Timestamp

**Verification**: Check `click_events` table in Supabase

---

## 2. Video Watching Data ✅

**Component**: `components/video-player.tsx`
**API Endpoint**: `/api/events` with various video event types
**Database Tables**:
- `user_video_analytics` - Summary analytics
- `video_interaction_events` - Detailed events
- `content_interaction_logs` - Master log

**What's Tracked**:
- Video play, pause, seek, rewind, fast-forward
- Playback position
- Total watched time
- Completion percentage
- Watch segments and skipped segments
- Engagement score

**Event Types**:
- `video_play`
- `video_pause`
- `video_seek`
- `video_rewind`
- `video_fast_forward`
- `video_loaded`
- `video_progress_milestone`
- `video_ended`
- `video_watch_completed`
- `video_error`

**Verification**: Check `user_video_analytics` and `video_interaction_events` tables

---

## 3. Chatbot Interaction Data ✅

**Components**: 
- `components/solbot-chat.tsx`
- `components/guided-learning-objective.tsx`
- `components/guided-mcii.tsx`
- `components/guided-monitoring.tsx`
- `components/floating-chatbot.tsx`

**API Endpoints**:
- `/api/events` with `event_type: 'chat_message'`
- `/api/analytics/chat` - Chat session start
- `/api/analytics/chat/[id]` - Chat session end

**Database Tables**:
- `messages` - All chat messages (user and AI)
- `user_chat_analytics` - Chat session summaries
- `chat_conversations` - Conversation records with assessments
- `assessments` - Evaluation scores and feedback
- `content_interaction_logs` - Master log

**What's Tracked**:
- All user messages (content, timestamp)
- All AI responses (content, evaluation, timestamp)
- Chat session duration
- Message count
- Assessment scores and feedback
- Evaluation metadata (scores, categories, scaffolding)

**Verification**: Check `messages`, `user_chat_analytics`, and `assessments` tables

---

## 4. Quiz Results Data ✅

**Component**: `components/pre-post-knowledge-check.tsx`
**API Endpoint**: `/api/events` with quiz event types
**Database Tables**:
- `knowledge_check_attempts` - Individual question attempts
- `quiz_session_summaries` - Quiz completion summaries
- `content_interaction_logs` - Master log

**Event Types**:
- `quiz_started` (pre_test_started or post_test_started)
- `quiz_question_answered`
- `quiz_completed` (pre_test_completed or post_test_completed)

**What's Tracked**:
- Question ID and text
- Selected answer
- Correct answer
- Is correct (boolean)
- Time to answer (seconds)
- Time to first interaction (seconds)
- Question type (definition/scenario)
- Test type (pre/post)
- Quiz completion status

**Verification**: Check `knowledge_check_attempts` and `quiz_session_summaries` tables

---

## 5. Feedback Viewing Data ✅

**Component**: `components/feedback-display.tsx`
**API Endpoint**: `/api/events` with `event_type: 'feedback_style_view'`
**Database Tables**:
- `feedback_style_views` - Feedback style viewing data
- `content_interaction_logs` - Master log

**What's Tracked**:
- View type (original/alternative)
- Style viewed (warm/direct)
- View duration (seconds)
- Evaluation score and category
- Previous view duration (when switching)

**Verification**: Check `feedback_style_views` table

---

## 6. Navigation Data ✅

**Component**: `components/navigation-tracker.tsx`
**API Endpoint**: `/api/events` with navigation event types
**Database Tables**:
- `navigation_events` - Navigation tracking
- `content_interaction_logs` - Master log

**Event Types**:
- `page_view`
- `phase_transition`
- `next_button`

**What's Tracked**:
- From path / to path
- From phase / to phase
- Time on page (seconds)
- Navigation type

**Verification**: Check `navigation_events` table

---

## 7. POST-Task Assessment Data ✅

**Component**: `components/post-task-assessment.tsx`
**API Endpoint**: `/api/events` with assessment event types
**Database Tables**:
- `content_interaction_logs` - Master log (with answer content)

**Event Types**:
- `post_task_assessment_started`
- `post_task_question_answered`
- `post_task_assessment_completed`
- `sample_answer_viewed` (for control group)

**What's Tracked**:
- Question ID and text
- Answer content
- Answer length
- Time spent (seconds)
- Question category (application/reflection/synthesis/metacognition)
- Sample answer viewing (for control group)

**Verification**: Check `content_interaction_logs` table filtered by `interaction_type`

---

## Claude API Connection Verification

### Backend Configuration
**File**: `backend/utils/llm.py`
**Model**: `claude-sonnet-4-5` (default)
**Environment Variable**: `CLAUDE_MODEL` (can override default)

**Verification Steps**:
1. Check Render environment variables:
   - `ANTHROPIC_API_KEY` - Must be set
   - `CLAUDE_MODEL` - Should be `claude-sonnet-4-5`

2. Check backend logs for:
   - "Using Claude model: claude-sonnet-4-5"
   - "Anthropic client initialized"

3. Test API endpoint:
   ```bash
   curl -X POST https://solbot-backend.onrender.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"session_id":"test","message":"test","phase":"phase2","component":"test"}'
   ```

---

## Common Issues and Fixes

### Issue 1: `quizCompleted is not defined`
**Fixed**: Changed to use `preTestCompleted` in Phase 2 page

### Issue 2: `/api/analytics/chat/[id]` 404
**Fixed**: Updated route handler to use Next.js 13+ async params pattern

### Issue 3: Missing favicon
**Fixed**: Created favicon.ico in public directory

### Issue 4: Data not logging
**Check**:
1. Session ID exists in localStorage
2. Supabase environment variables are set
3. Database tables exist (run migration scripts)
4. Check browser console for errors
5. Check Network tab for failed API calls

---

## Database Schema Verification

Run these queries in Supabase SQL Editor to verify tables exist:

```sql
-- Check all tracking tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'click_events',
  'user_video_analytics',
  'video_interaction_events',
  'messages',
  'user_chat_analytics',
  'chat_conversations',
  'assessments',
  'knowledge_check_attempts',
  'quiz_session_summaries',
  'feedback_style_views',
  'navigation_events',
  'content_interaction_logs'
);
```

---

## Testing Checklist

- [ ] Click tracking works (check `click_events` table)
- [ ] Video play/pause/seek tracked (check `video_interaction_events`)
- [ ] Chatbot messages logged (check `messages` table)
- [ ] Quiz answers recorded (check `knowledge_check_attempts`)
- [ ] Feedback views tracked (check `feedback_style_views`)
- [ ] Navigation events logged (check `navigation_events`)
- [ ] POST-task answers saved (check `content_interaction_logs`)
- [ ] Claude API responds correctly (check backend logs)
- [ ] All data linked to correct session_id and user_id

# Chain Prompting Performance & Database Updates

## Overview

This document explains the chain prompting implementation, performance considerations, and required database updates.

## Chain Prompting Architecture

### Two-Step Process

1. **Step 1: Evaluation (Rubric-Based)**
   - Uses `get_evaluation_prompt()` - no style, pure assessment
   - Temperature: 0.2 (very low for consistency)
   - Max tokens: 400 (shorter for faster response)
   - **Strictly follows rubric criteria** - 3 criteria per phase
   - Returns evaluation metadata (scores, categories, scaffolding level)

2. **Step 2: Feedback Generation (Style-Based)**
   - Uses `get_feedback_prompt()` - with user's preferred style
   - Temperature: 0.5 (higher for natural language)
   - Max tokens: 800 (full feedback)
   - Uses evaluation results from Step 1
   - Generates feedback in warm/direct style

### Performance Impact

**Is chain prompting slower?**

- **Evaluation step**: ~1-2 seconds (400 tokens, low temperature)
- **Feedback step**: ~2-3 seconds (800 tokens, normal temperature)
- **Total**: ~3-5 seconds (vs ~3-4 seconds for single call)

**Optimization strategies:**
- Evaluation uses shorter max_tokens (400 vs 800)
- Lower temperature (0.2) makes evaluation faster
- Both steps are sequential but optimized for speed
- Fallback to single-step if chain fails

**Performance tracking:**
- `evaluation_time_ms`: Time for Step 1
- `feedback_time_ms`: Time for Step 2
- Stored in `assessments` table for analysis

## Rubric-Based Evaluation

### Ensuring Rubric Compliance

All evaluations **must** follow the rubric criteria defined in each phase:

**Phase 2 (Learning Objectives):**
1. Task Identification
2. Resource Specificity

**Phase 4 (MCII):**
1. Goal Clarity & Relevance
2. Visualization Quality
3. Obstacle Identification
4. Implementation Intention Quality

**Phase 5 (Monitoring):**
1. Progress Checks
2. Adaptation Strategies
3. Self-Regulation Indicators

The evaluation prompt explicitly:
- Extracts rubric criteria from base prompt
- Instructs Claude to use ONLY rubric definitions
- Requires matching LOW/MEDIUM/HIGH to rubric definitions
- Calculates scores based on rubric (0/1/2)

## Database Updates Required

### 1. Run SQL Migration

Execute `database/add_feedback_style_tracking.sql` in Supabase:

```sql
-- Adds columns to assessments table
ALTER TABLE assessments 
  ADD COLUMN IF NOT EXISTS evaluation_method TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS evaluation_prompt_used TEXT,
  ADD COLUMN IF NOT EXISTS feedback_style TEXT,
  ADD COLUMN IF NOT EXISTS alternative_feedback_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS evaluation_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS feedback_time_ms INTEGER;

-- Creates feedback_style_views table
CREATE TABLE IF NOT EXISTS feedback_style_views (...);

-- Creates analysis view
CREATE OR REPLACE VIEW feedback_style_analysis AS ...;
```

### 2. New Tables & Columns

**`assessments` table additions:**
- `evaluation_method`: 'standard' or 'chain'
- `evaluation_prompt_used`: Which prompt was used
- `feedback_style`: 'warm' or 'direct'
- `alternative_feedback_generated`: Whether user viewed alternative
- `evaluation_time_ms`: Performance metric
- `feedback_time_ms`: Performance metric

**`feedback_style_views` table (new):**
- Tracks each time user views original/alternative feedback
- Records view duration
- Links to assessment_id for analysis

**`feedback_style_analysis` view (new):**
- Aggregates feedback style preferences
- Calculates average view durations
- Compares original vs alternative engagement

## Benefits of Chain Prompting

1. **Evaluation Consistency**: Same scores across both styles
2. **Rubric Compliance**: Explicit rubric enforcement
3. **Performance Tracking**: Detailed timing metrics
4. **Research Analytics**: Rich data on user preferences

## Fallback Behavior

If chain prompting fails:
- Logs warning
- Falls back to standard single-step prompt
- Still records evaluation metadata
- Marks as `evaluation_method = 'chain_fallback'`

## Verification

To verify rubric compliance:
1. Check `assessments.evaluation_method = 'chain'`
2. Review `assessments.full_evaluation` JSONB field
3. Ensure all 3 criteria are scored (0/1/2)
4. Verify `overall_score` = sum of criterion scores

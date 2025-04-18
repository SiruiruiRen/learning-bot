# Database Fix Instructions

## Option 1: Fix Only the llm_interactions Table (Recommended)

If you want to keep your current data and only fix the `llm_interactions` table that's causing the error, follow these steps:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_llm_interactions.sql` into the editor
4. Run the script

This will add the missing columns to the `llm_interactions` table without affecting any existing data.

## Option 2: Complete Schema Reset (Use with caution)

If you want to completely reset your database and recreate all tables with the correct schema, follow these steps:

**WARNING: This will delete all your existing data!**

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_database_schema.sql` into the editor
4. Run the script

This will drop all existing tables and recreate them with the correct schema.

## Verifying the Fix

After running either of the scripts, you can verify that the fix was applied successfully by checking the logs in your Render dashboard. The error message `Could not find the 'input_tokens' column of 'llm_interactions' in the schema cache` should no longer appear.

## Schema Overview

The database schema includes the following tables:

- `users`: Stores user information
- `conversations`: Tracks conversation sessions
- `messages`: Stores individual messages within conversations
- `llm_interactions`: Records interactions with the LLM
- `assessments`: Stores assessment scores
- `scaffolding_levels`: Tracks scaffolding levels for users
- `scaffolding_history`: Records scaffolding level history
- `user_data`: Stores generic user data
- `submissions`: Records user submissions
- `phase_progress`: Tracks user progress through phases
- `user_goals`: Stores user goals
- `monitoring_records`: Records monitoring data

The schema is designed to support the SoLBot learning platform's functionality for self-regulated learning. 
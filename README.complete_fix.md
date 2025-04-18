# Complete Fix for SoLBot Database and Application Code

This document provides instructions for fixing both the database schema and application code to properly track scaffolding levels and other data.

## Step 1: Fix the Database Schema

### Option 1: Fix Only the llm_interactions Table (Recommended First Step)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_llm_interactions.sql` into the editor
4. Run the script

This will add the missing columns to the `llm_interactions` table that are causing the immediate errors.

### Option 2: Complete Schema Reset (Use with caution)

Only use this if the more targeted fix doesn't work or if you're comfortable losing existing data.

**WARNING: This will delete all your existing data!**

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix_database_schema.sql` into the editor
4. Run the script

## Step 2: Fix the Application Code

The application is not properly saving scaffolding levels to the database. To fix this:

1. Add the `save_scaffolding_level` function to `backend/utils/db.py`
   - Copy the function from `fix_save_scaffolding_level.py`
   - Add it after the `get_scaffolding_level` function

2. Update the imports in `backend/routes/chat.py` to include `save_scaffolding_level`:
   ```python
   from backend.utils.db import (
       save_message, 
       get_user_profile, 
       get_messages, 
       _memory_db, 
       _using_memory_db,
       save_scaffolding_level
   )
   ```

3. Add code to call `save_scaffolding_level` in the submission handling code:
   ```python
   # Save the scaffolding level to the database
   try:
       save_scaffolding_level(
           user_id=user_id, 
           phase=phase, 
           component=component,
           level=recommended_scaffolding,
           conversation_id=conversation_id,
           reason=f"Submission evaluation for {request.get('submission_type', 'goal')}"
       )
   except Exception as scaffolding_err:
       logger.error(f"Error saving scaffolding level: {scaffolding_err}")
   ```

## Step 3: Deploy and Test

1. Push your changes to your repository
2. Redeploy the application on Render
3. Test that submissions correctly save scaffolding levels:
   - Check the logs for "Error saving scaffolding level" messages
   - Verify in the Supabase dashboard that records are being created in the `scaffolding_levels` table

## The Problem and Solution Explained

The issue with your application was two-fold:

1. **Database Schema Issue**: The `llm_interactions` table was missing the `input_tokens`, `output_tokens`, and `duration_ms` columns, causing errors when the application tried to save LLM interactions.

2. **Code Issue**: While the application was correctly determining scaffolding levels and including them in the message metadata, it wasn't actually saving them to the dedicated `scaffolding_levels` table. This is because there was no `save_scaffolding_level` function implemented in the db.py file.

The fixes provided address both issues:

1. The database schema fix adds the missing columns to the `llm_interactions` table.
2. The code fix adds the missing `save_scaffolding_level` function and updates the submission handling code to call it.

With these changes, your application should now properly track scaffolding levels in the database, making it possible to analyze how scaffolding levels change over time for each user and phase. 
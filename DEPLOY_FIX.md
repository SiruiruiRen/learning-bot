# Database Schema and Function Name Fix

## Problem Identified

Based on the error logs, we've identified two main issues:

1. **Function Name Mismatch**: The application is calling `save_user_data`, but the Supabase database has `save_user_data_v2` instead, causing a 404 error.

2. **Schema Cache Issues**: The Supabase PostgREST cache doesn't recognize the `value` column in the `user_data` table and the `email` column in the `users` table.

## Solution

We've made the following changes to fix these issues:

1. Updated `backend/routes/user_data.py` to consistently use the `save_user_data` function.

2. Created a new migration script `database/migrations/007_function_name_fix.sql` that:
   - Drops the `save_user_data_v2` function if it exists
   - Creates/replaces the `save_user_data` function to match what the application is calling
   - Explicitly refreshes the schema cache
   - Verifies and adds any missing columns to the `user_data` and `users` tables

## How to Apply the Fix

### Option 1: Apply the Migration Through Supabase Interface

1. Login to your Supabase project
2. Go to the SQL Editor
3. Copy the contents of `database/migrations/007_function_name_fix.sql`
4. Paste into the SQL Editor and run the script
5. Verify there are no errors in the execution

### Option 2: Apply Using Database Client

1. Connect to your Supabase PostgreSQL database using a database client (like pgAdmin, DBeaver, etc.)
2. Run the SQL script from `database/migrations/007_function_name_fix.sql`

### Option 3: Apply Using Supabase CLI

If you have the Supabase CLI set up:

```bash
supabase db push -f database/migrations/007_function_name_fix.sql
```

## Verify the Fix

After applying the migration:

1. Check if the `save_user_data` function exists in the database (not `save_user_data_v2`)
2. Verify that the `user_data` table has the `value` and `metadata` columns
3. Verify that the `users` table has the `email` column
4. Manually trigger a schema cache reload if needed

## Redeploy the Application

After applying the database changes, redeploy your application on Render to ensure everything is in sync.

## Monitoring

After deploying the fix, monitor the logs to ensure:
- No more 404 errors for the function call
- No more schema cache errors for missing columns

If the errors persist, you may need to directly contact Supabase support to forcefully refresh their schema cache. 
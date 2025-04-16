#!/bin/bash

# Script to apply database fixes for SoLBot

echo "===== SoLBot Database Fix Script ====="
echo "This script will apply the migration to fix database function name and schema issues."

# Check if SUPABASE_URL and SUPABASE_KEY environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set."
  echo "You can find these in your Supabase project settings."
  echo "Example:"
  echo "export SUPABASE_URL=https://yourproject.supabase.co"
  echo "export SUPABASE_KEY=your-service-role-key"
  exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "Error: psql is not installed. Please install PostgreSQL client tools."
  exit 1
fi

# Get database connection string
DB_URL=$(echo $SUPABASE_URL | sed 's/https:\/\///')
DB_HOST="${DB_URL%%.*}.db.supabase.co"
DB_PORT=5432
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD=$SUPABASE_KEY

echo "Connecting to database at $DB_HOST..."

# Create a temporary file with the SQL content
TMP_FILE=$(mktemp)
cat database/migrations/007_function_name_fix.sql > $TMP_FILE

# Run the migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f $TMP_FILE

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Migration applied successfully!"
  echo "Now redeploy your application to Render to complete the fix."
else
  echo "Error: Failed to apply migration."
  echo "Please try applying the migration manually using the Supabase SQL Editor."
fi

# Clean up
rm $TMP_FILE

echo "===== Done =====" 
"""
Reset Supabase database schema script.
This script will drop all existing tables and recreate them with the proper schema.
WARNING: This will delete all data in the database.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("db.reset")

# Load environment variables
load_dotenv()

try:
    from supabase import create_client
except ImportError:
    logger.error("Supabase package not installed. Run 'pip install supabase'")
    sys.exit(1)

def confirm_reset():
    """Confirm with the user that they want to reset the database"""
    response = input("\n⚠️  WARNING: This will delete ALL data in your database! Are you sure? (y/N): ")
    return response.lower() == 'y'

def reset_database():
    """Reset the Supabase database using the SQL schema"""
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Supabase credentials not found. Please check your .env file.")
        sys.exit(1)
    
    # Create Supabase client
    try:
        logger.info(f"Connecting to Supabase at {supabase_url}")
        client = create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Read the SQL file
    script_dir = Path(__file__).parent
    sql_file = script_dir / "reset_schema.sql"
    
    try:
        with open(sql_file, 'r') as f:
            sql = f.read()
    except Exception as e:
        logger.error(f"Failed to read SQL file: {e}")
        sys.exit(1)
    
    # Execute SQL statements one by one
    logger.info("Executing SQL statements...")
    try:
        # Split the SQL into individual statements
        statements = sql.split(';')
        
        for statement in statements:
            # Skip empty statements
            if statement.strip():
                logger.info(f"Executing: {statement[:60]}...")
                # Execute the statement using the Postgres API
                response = client.rpc("exec_sql", {"sql_string": statement})
    except Exception as e:
        logger.error(f"Failed to execute SQL: {e}")
        sys.exit(1)
    
    logger.info("✅ Database schema reset successfully!")

if __name__ == "__main__":
    logger.info("Database Reset Utility")
    
    if confirm_reset():
        reset_database()
    else:
        logger.info("Database reset cancelled.")
        sys.exit(0) 
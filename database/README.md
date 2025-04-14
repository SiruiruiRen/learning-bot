# SoLBot Database

This directory contains database migrations and schema for the SoLBot Learning Platform.

## Database Schema

The SoLBot platform uses a PostgreSQL database with Supabase. The schema is designed to support:
- User management and authentication
- Learning progress tracking
- AI agent conversations
- Rubric-based assessment
- Resource management

For a detailed overview of the database design, see the [schema documentation](../schema.md).

## Migrations

Migrations are used to track and apply database changes:

1. `001_initial_schema.sql` - Initial database setup with all tables
2. `002_seed_data.sql` - Seed data for learning phases, courses, and rubrics
3. `003_data_validation.sql` - Database triggers and functions for validating and handling missing data

## Setting Up the Database

### Automated Setup

We've added a Python script to help set up the database tables in Supabase:

1. Install the required Python packages:
   ```bash
   pip3 install supabase python-dotenv requests
   ```

2. Run the export script to generate the SQL:
   ```bash
   cd backend
   python3 export_sql.py
   ```

3. Copy the SQL output and run it in the Supabase SQL Editor

4. Verify the database setup:
   ```bash
   python3 verify_tables.py
   ```

### Manual Setup with Supabase

1. Create a new project in [Supabase](https://supabase.com/)
2. Go to the SQL Editor
3. Run the migrations in order:
   ```
   001_initial_schema.sql
   002_seed_data.sql
   003_data_validation.sql
   ```

### With Local PostgreSQL

1. Create a new database:
   ```bash
   createdb solbot
   ```

2. Run the migrations:
   ```bash
   psql -d solbot -f database/migrations/001_initial_schema.sql
   psql -d solbot -f database/migrations/002_seed_data.sql
   psql -d solbot -f database/migrations/003_data_validation.sql
   ```

## Connecting to the Database

Create a `.env.local` file in the project root with your database connection details:

```
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Or for a direct PostgreSQL connection:

```
DATABASE_URL=postgresql://username:password@localhost:5432/solbot
```

## Error Handling and Data Validation

The platform has comprehensive error handling and data validation:

### Database-Level Validation

- Database triggers validate enum-like fields (status, difficulty, etc.)
- Default values are provided for missing fields
- Constraints ensure data integrity
- PostgreSQL functions for common operations with proper error handling

### Application-Level Utilities

The `database/utils` directory contains utilities for handling missing data:

- `errorHandling.js` - Database error processing and standardization
- `dataProcessor.js` - Data processing functions to apply defaults and validate input

### Using Error Handling

To use the error handling in your API routes:

```javascript
const { withErrorHandling, performTransaction } = require('../database/utils/errorHandling');
const { processUserData } = require('../database/utils/dataProcessor');

// Wrap database operations with error handling
const createUser = withErrorHandling(async (userData) => {
  // Process data to handle missing fields
  const processedData = processUserData(userData);
  
  // Perform the database operation
  const result = await db.query('INSERT INTO users (...) VALUES (...)', processedData);
  return result;
}, 'create-user');
```

## Entity Relationship Model

The database follows the entity relationship model described in `schema.md`. Key relationships:

- Users have courses (user_courses)
- Courses have learning phases
- Users progress through phases (phase_progress)
- Each phase has rubrics for assessment
- Conversations are linked to specific phase progress 


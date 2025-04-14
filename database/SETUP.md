# Setting Up the Database for User Data Collection

This guide walks you through setting up the Supabase database for user data collection.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Access to your project's Supabase dashboard

## Steps to Set Up the Database

1. **Sign in to your Supabase account**
   - Go to [https://supabase.com/](https://supabase.com/) and sign in
   - Open your project dashboard

2. **Run database migrations**
   - Navigate to the SQL Editor in your Supabase dashboard
   - Create a new query

3. **Execute each migration file in order**
   - Run the contents of each SQL file in the `database/migrations` directory:
     1. `001_initial_schema.sql` - Sets up basic tables
     2. `002_seed_data.sql` (if exists) - Adds initial data
     3. `003_data_validation.sql` (if exists) - Adds validation
     4. `004_user_data.sql` - Adds user data collection table

4. **Verify tables were created**
   - Go to the "Table Editor" to confirm that the `user_data` table exists
   - It should have columns: `id`, `user_id`, `data_type`, `value`, `metadata`, and `created_at`

## Environment Variables

The following environment variables need to be set:

```
DATABASE_ENABLED=true
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For the backend:

```
USE_MEMORY_DB=false
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Testing the Database

1. **Create a test user**
   Execute in the SQL Editor:
   ```sql
   INSERT INTO users (email) VALUES ('test@example.com') RETURNING id;
   ```
   Copy the returned UUID.

2. **Add test user data**
   ```sql
   INSERT INTO user_data (user_id, data_type, value, metadata)
   VALUES 
   ('paste-user-id-here', 'test', 'Hello World', '{"source": "manual_test"}');
   ```

3. **Query the data**
   ```sql
   SELECT * FROM user_data WHERE user_id = 'paste-user-id-here';
   ```

## Using the API

The app includes these endpoints:

- `POST /api/user-data` - Save user data
  ```json
  {
    "userId": "user-id",
    "dataType": "page_view",
    "value": "/landing",
    "metadata": { "referrer": "google" }
  }
  ```

- `GET /api/user-data?userId=user-id&dataType=page_view` - Get user data

## React Hook

A React hook is available for easy integration:

```jsx
import { useUserData } from '@/hooks/useUserData';

function YourComponent() {
  const { saveUserData, getUserData, trackEvent, loading, error } = useUserData();
  
  const handleButtonClick = async () => {
    await trackEvent(
      localStorage.getItem('userId'),
      'button_click', 
      { buttonId: 'start-quiz' }
    );
  };
  
  return <button onClick={handleButtonClick}>Start Quiz</button>;
}
``` 
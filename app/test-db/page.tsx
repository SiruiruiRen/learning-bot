import TestDatabaseConnection from '@/components/TestDatabaseConnection';

export default function TestDatabasePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      <p className="mb-8">
        This page tests the connection to the Supabase database and verifies that user data tracking is working properly.
      </p>
      
      <TestDatabaseConnection />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">How this works:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>The component attempts to connect to your Supabase database using the anon key</li>
          <li>If successful, it fetches up to 5 users from the database</li>
          <li>It records a test event using the user data tracking system</li>
          <li>It then retrieves and displays any tracked events for the current user</li>
        </ol>
      </div>
    </div>
  );
} 
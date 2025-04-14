import DatabaseConnectionTest from '@/components/DatabaseConnectionTest';

export default function TestDatabasePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      <p className="mb-8">
        This page tests the connection to the Supabase database and verifies that user data tracking is working properly.
      </p>
      
      <DatabaseConnectionTest />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">How this works:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>The component attempts to connect to your Supabase database using the anon key</li>
          <li>If successful, it fetches up to 5 users from the database</li>
          <li>It records a test event using the user data tracking system</li>
          <li>It then retrieves and displays any tracked events for the current user</li>
        </ol>
        
        <h2 className="text-xl font-bold mt-8 mb-4">Deployment Configuration:</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Vercel Configuration:</h3>
            <ul className="list-disc pl-5">
              <li>Add <code className="bg-gray-700 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> environment variable</li>
              <li>Add <code className="bg-gray-700 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> environment variable</li>
              <li>Set <code className="bg-gray-700 px-1 rounded">DATABASE_ENABLED=true</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Render Configuration:</h3>
            <ul className="list-disc pl-5">
              <li>Add <code className="bg-gray-700 px-1 rounded">SUPABASE_URL</code> environment variable</li>
              <li>Add <code className="bg-gray-700 px-1 rounded">SUPABASE_KEY</code> environment variable (using service role key)</li>
              <li>Set <code className="bg-gray-700 px-1 rounded">USE_MEMORY_DB=false</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
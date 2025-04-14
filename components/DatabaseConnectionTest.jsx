'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUserData } from '@/hooks/useUserData';

export default function DatabaseConnectionTest() {
  const [status, setStatus] = useState('Checking connection...');
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState([]);
  const { trackEvent } = useUserData();
  const [testId, setTestId] = useState('test-' + Math.random().toString(36).substring(7));
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // Check if environment variables are available
    const vars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (masked)' : 'Not set',
      DATABASE_ENABLED: process.env.DATABASE_ENABLED || 'Not set'
    };
    setEnvVars(vars);
    
    async function checkConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Missing Supabase credentials:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
          setStatus('Supabase client not initialized - missing environment variables');
          return;
        }

        // Create client inside the effect to ensure it has the latest env vars
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test a simple query to see if we can connect
        const { data, error } = await supabase.from('users').select('id, email').limit(5);
        
        if (error) {
          console.error('Database connection error:', error);
          setStatus(`Connection Error: ${error.message}`);
        } else {
          setUsers(data || []);
          setStatus(`Connected to database! Found ${data?.length || 0} users.`);
          
          // Generate a test event
          const userId = localStorage?.getItem('userId') || 'anonymous';
          await trackEvent(userId, 'database_connection_test', {
            timestamp: new Date().toISOString(),
            testId: testId
          });
          
          // Fetch events from our API
          try {
            const response = await fetch(`/api/user-data?userId=${userId}&dataType=event`);
            if (response.ok) {
              const events = await response.json();
              setUserData(events);
            } else {
              console.error('API error:', response.status, await response.text());
            }
          } catch (apiError) {
            console.error('API fetch error:', apiError);
          }
        }
      } catch (err) {
        console.error('Error testing connection:', err);
        setStatus(`Error: ${err.message}`);
      }
    }
    
    checkConnection();
  }, [testId, trackEvent]);

  return (
    <div className="p-4 border rounded-md bg-gray-800">
      <h2 className="text-xl mb-4">Database Connection Test</h2>
      
      <div className="mb-4">
        <h3 className="text-lg mb-2">Environment Variables:</h3>
        <pre className="text-xs bg-gray-900 p-2 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <div className={`px-4 py-2 rounded ${status.includes('Error') ? 'bg-red-900' : status.includes('Connected') ? 'bg-green-900' : 'bg-yellow-900'}`}>
          {status}
        </div>
      </div>
      
      {users.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg mb-2">Users in Database:</h3>
          <ul className="list-disc pl-5">
            {users.map(user => (
              <li key={user.id}>{user.email || user.id}</li>
            ))}
          </ul>
        </div>
      )}
      
      {userData.length > 0 && (
        <div>
          <h3 className="text-lg mb-2">Tracked Events:</h3>
          <ul className="list-disc pl-5">
            {userData.slice(0, 5).map(event => (
              <li key={event.id}>
                {event.value} - {new Date(event.created_at).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button 
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        onClick={() => setTestId('test-' + Math.random().toString(36).substring(7))}
      >
        Run Test Again
      </button>
    </div>
  );
} 
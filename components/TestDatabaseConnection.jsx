'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUserData } from '@/hooks/useUserData';

export default function TestDatabaseConnection() {
  const [status, setStatus] = useState('Checking connection...');
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState([]);
  const { trackEvent } = useUserData();
  const [testId, setTestId] = useState('test-' + Math.random().toString(36).substring(7));

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  useEffect(() => {
    async function checkConnection() {
      try {
        if (!supabaseUrl || !supabaseKey) {
          console.error('Missing Supabase credentials:', { supabaseUrl, supabaseKey });
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
          const userId = localStorage.getItem('userId') || 'anonymous';
          await trackEvent(userId, 'database_connection_test', {
            timestamp: new Date().toISOString(),
            testId: testId
          });
          
          // Fetch events from our API
          const response = await fetch(`/api/user-data?userId=${userId}&dataType=event`);
          if (response.ok) {
            const events = await response.json();
            setUserData(events);
          }
        }
      } catch (err) {
        console.error('Error testing connection:', err);
        setStatus(`Error: ${err.message}`);
      }
    }
    
    checkConnection();
  }, [supabaseUrl, supabaseKey, testId, trackEvent]);

  return (
    <div className="p-4 border rounded-md bg-gray-800">
      <h2 className="text-xl mb-4">Database Connection Test</h2>
      <div className="mb-4">
        <div className={`px-4 py-2 rounded ${status.includes('Error') ? 'bg-red-900' : status.includes('Connected') ? 'bg-green-900' : 'bg-yellow-900'}`}>
          {status}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          <p>URL: {supabaseUrl ? 'Set' : 'Missing'}</p>
          <p>Key: {supabaseKey ? 'Set (masked)' : 'Missing'}</p>
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
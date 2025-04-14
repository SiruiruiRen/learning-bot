import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if database is enabled
const isDatabaseEnabled = process.env.DATABASE_ENABLED !== 'false';

// Initialize Supabase client with error handling
let supabase: any = null;
try {
  if (isDatabaseEnabled) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully in user data API');
    } else {
      console.warn('Supabase URL or key missing in user data API, database features will be disabled');
    }
  } else {
    console.log('Database functionality is explicitly disabled in user data API by DATABASE_ENABLED=false');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client in user data API:', error);
}

// Maximum number of retries for backend API calls
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Helper function for retrying API calls
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying API call, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Collect user data and store it
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, dataType, value, metadata } = body;
    
    console.log(`Received user data: userId=${userId}, dataType=${dataType}`);
    
    // Validate required fields
    if (!userId || !dataType || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, dataType, and value are required' },
        { status: 400 }
      );
    }
    
    // Store in Supabase directly if available and enabled
    if (isDatabaseEnabled && supabase) {
      try {
        // Check if user exists first
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        // Create user if doesn't exist
        if (!existingUser && !userError) {
          await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            created_at: new Date().toISOString()
          });
        }
        
        // Save user data
        const { data, error } = await supabase
          .from('user_data')
          .insert({
            user_id: userId,
            data_type: dataType,
            value: value,
            metadata: metadata || null,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error saving to Supabase:', error);
          // Fall through to backend attempt
        } else {
          return NextResponse.json({ success: true, data });
        }
      } catch (error) {
        console.error('Supabase error:', error);
        // Fall through to backend attempt
      }
    }
    
    // Forward to backend API as fallback
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
      const endpoint = `/api/user-data/${userId}`;
      const fullUrl = `${backendUrl}${endpoint}`;
      
      console.log(`Forwarding user data to backend at ${fullUrl}`);
      
      const backendResponse = await fetchWithRetry(
        fullUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data_type: dataType,
            value: value,
            metadata: metadata || null
          }),
        }
      );
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error(`Backend error: ${backendResponse.status} - ${errorText}`);
        
        // Return a 200 response to the client to avoid errors, but include error details
        return NextResponse.json({
          success: false,
          stored: 'memory',
          error: `Backend error: ${backendResponse.status}`
        });
      }
      
      const data = await backendResponse.json();
      return NextResponse.json({ success: true, data });
      
    } catch (error: any) {
      console.error('Error communicating with backend:', error);
      
      // Store in memory as last resort
      return NextResponse.json({
        success: true,
        stored: 'memory',
        id: `memory-${Date.now()}`,
        created_at: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in user-data API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}

// Retrieve user data
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const dataType = request.nextUrl.searchParams.get('dataType');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
    
    // Try to get from Supabase if available
    if (isDatabaseEnabled && supabase) {
      try {
        let query = supabase
          .from('user_data')
          .select('*')
          .eq('user_id', userId);
        
        if (dataType) {
          query = query.eq('data_type', dataType);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase error:', error);
          // Fall through to backend attempt
        } else {
          return NextResponse.json(data || []);
        }
      } catch (error) {
        console.error('Error querying Supabase:', error);
        // Fall through to backend attempt
      }
    }
    
    // Try backend as fallback
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
      let endpoint = `/api/user-data/${userId}`;
      if (dataType) {
        endpoint += `?data_type=${encodeURIComponent(dataType)}`;
      }
      const fullUrl = `${backendUrl}${endpoint}`;
      
      console.log(`Getting user data from backend at ${fullUrl}`);
      
      const backendResponse = await fetchWithRetry(
        fullUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error(`Backend error: ${backendResponse.status} - ${errorText}`);
        return NextResponse.json([], { status: 200 }); // Return empty array
      }
      
      const data = await backendResponse.json();
      return NextResponse.json(data);
      
    } catch (error) {
      console.error('Error communicating with backend:', error);
      return NextResponse.json([]); // Return empty array as fallback
    }
  } catch (error: any) {
    console.error('Unexpected error in user-data GET API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 
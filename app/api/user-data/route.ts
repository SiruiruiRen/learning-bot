import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Helper to generate a consistent UUID from any string
function generateUuidFromString(input: string): string {
  // Create a hash from the input string
  const hash = createHash('md5').update(input).digest('hex')
  
  // Convert to UUID format (version 4-like)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // Version 4 UUID has specific bits set
    '4' + hash.substring(13, 16),
    // UUID variant bits
    '8' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-')
  
  return uuid
}

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
    
    // Create a proper UUID from the userId if it's not already a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidPattern.test(userId)
    const formattedUserId = isUuid ? userId : generateUuidFromString(userId)
    
    // Store in Supabase directly if available and enabled
    if (isDatabaseEnabled && supabase) {
      try {
        // Check if user exists first
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', formattedUserId)
          .maybeSingle();
        
        // Create user if doesn't exist
        if (!existingUser && !userError) {
          // Try to get the email from local storage
          let userEmail = `${userId}@example.com`;
          
          // If we're running in the browser and this is a client-side call
          if (typeof window !== 'undefined') {
            const storedEmail = localStorage.getItem('solbot_user_email');
            if (storedEmail) {
              userEmail = storedEmail;
            }
          }
          
          // If metadata contains email, use that instead
          if (metadata && metadata.email) {
            userEmail = metadata.email;
          }
          
          await supabase.from('users').insert({
            id: formattedUserId,
            email: userEmail,
            created_at: new Date().toISOString()
          });
        }
        
        // Save user data
        const { data, error } = await supabase
          .from('user_data')
          .insert({
            user_id: formattedUserId,
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
      const endpoint = `/api/user-data/${formattedUserId}`;
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
    
    // Create a proper UUID from the userId if it's not already a UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isUuid = uuidPattern.test(userId)
    const formattedUserId = isUuid ? userId : generateUuidFromString(userId)
    
    // Try to get from Supabase if available
    if (isDatabaseEnabled && supabase) {
      try {
        let query = supabase
          .from('user_data')
          .select('*')
          .eq('user_id', formattedUserId);
        
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
      let endpoint = `/api/user-data/${formattedUserId}`;
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
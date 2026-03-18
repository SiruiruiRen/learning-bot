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
      console.log('Supabase client initialized successfully');
    } else {
      console.warn('Supabase URL or key missing, database features will be disabled');
    }
  } else {
    console.log('Database functionality is explicitly disabled by DATABASE_ENABLED=false');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Maximum number of retries for backend API calls
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Define interface for backend request body
interface BackendRequestBody {
  user_id: string;
  phase: string;
  message: string;
  conversation_id?: string;
  raw_message?: string;
  component?: string;
  is_new_phase?: boolean;
}

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

// Proxy API route that forwards requests to the backend
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Handle analytics events
    if (body.event_type) {
      const { session_id, event_type, phase, component, metadata } = body;
      const { data: sessionData } = await supabase.from('sessions').select('user_id').eq('id', session_id).single();
      
      if (event_type === 'video_watch_completed') {
        await supabase.from('user_video_analytics').insert({
          session_id,
          user_id: sessionData?.user_id,
          phase,
          video_name: metadata.video_title,
          watched_duration_seconds: metadata.total_watched_seconds,
          completion_percentage: 100,
        });
      } else if (event_type === 'revision_submitted') {
        await supabase.from('user_revision_tracking').insert({
          session_id,
          user_id: sessionData?.user_id,
          phase,
          component,
          revision_number: metadata.attempt_number,
          content_changes: metadata.content_changes,
        });
      }
      return NextResponse.json({ success: true });
    }

    // Existing chat logic
    console.log("API route received request:", body)

    // Make sure we have required fields
    if (!body.phase || !body.message) {
      console.error("Missing required fields in request:", body)
      return NextResponse.json(
        { error: "Missing required fields", status: "error" },
        { status: 400 }
      )
    }

    // Set the backend URL
    const backendUrl = process.env.BACKEND_URL || 'https://solbot-backend.onrender.com'
    const endpoint = '/api/chat'
    const fullUrl = `${backendUrl}${endpoint}`
    
    console.log(`Forwarding request to backend at ${fullUrl}`)

    // Create a proper UUID from the user_id if it's not already a UUID
    if (body.user_id) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const isUuid = uuidPattern.test(body.user_id)
      if (!isUuid) {
        body.user_id = generateUuidFromString(body.user_id)
      }
    }

    try {
      // Forward the request to the backend with generous timeout for educational content
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("API call timeout - aborting fetch after generous wait for educational content");
        controller.abort();
      }, 120000); // 120 second timeout - generous for complex educational prompts
      
      // Implement robust retry logic for educational reliability
      let maxRetries = 3;  // More retries for educational systems
      let retryCount = 0;
      let backendResponse: Response | undefined;
      
      while (retryCount <= maxRetries) {
        try {
          // Forward the request to the backend
          backendResponse = await fetch(fullUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          
          // If we get here and the response is ok, break out of retry loop
          if (backendResponse.ok) {
            break;
          }
          
          // If not ok but not a network error, still break (we'll handle the error below)
          break;
          
        } catch (fetchError: any) {
          // Only retry on network errors, not on aborts
          if (fetchError.name !== 'AbortError') {
            retryCount++;
            console.log(`Retry attempt ${retryCount}/${maxRetries}`);
            
            if (retryCount <= maxRetries) {
              // Exponential backoff with cap for educational reliability
              const waitTime = Math.min(2000 * retryCount, 10000); // 2s, 4s, 6s, max 10s
              console.log(`Retrying after ${waitTime}ms for educational content reliability...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              // Max retries reached - let the outer catch handle it
              throw fetchError;
            }
          } else {
            // For abort errors, just throw immediately
            throw fetchError;
          }
        }
      }
      
      clearTimeout(timeoutId);

      // Make sure we have a response
      if (!backendResponse) {
        throw new Error("Failed to get response from server after multiple attempts");
      }

      // Log response status
      console.log(`Backend response status: ${backendResponse.status}`)

      // Handle different status codes
      if (!backendResponse.ok) {
        let errorText = await backendResponse.text()
        console.error("Backend error:", errorText)
        
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText)
          return NextResponse.json(
            { error: errorJson.error || "Backend error", details: errorJson, status: "error" },
            { status: backendResponse.status }
          )
        } catch (e) {
          // Not JSON, return as plain text
          return NextResponse.json(
            { error: "Backend error", details: errorText, status: "error" },
            { status: backendResponse.status }
          )
        }
      }

      // Parse the response
      const data = await backendResponse.json()
      console.log("Backend response:", data)

      // Ensure proper response structure
      if (!data || !data.data) {
        console.error("Invalid backend response structure:", data)
        return NextResponse.json(
          { 
            error: "Invalid response from backend", 
            details: "Backend returned unexpected format",
            status: "error" 
          },
          { status: 500 }
        )
      }

      // Return the response to the client
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Backend connection error:", fetchError)
      
      // Provide more detailed error messages based on the error type
      let errorMessage = "Could not connect to backend server";
      let errorDetails = fetchError.message || "Connection failed";
      let errorCode = fetchError.cause?.code || "UNKNOWN";
      
      // Educational-friendly error messages for different error types
      if (fetchError.name === 'AbortError') {
        errorMessage = "Request took longer than expected";
        errorDetails = "Complex educational content sometimes needs extra processing time. Your work is saved - please try again or continue to the next task.";
        errorCode = "TIMEOUT_EDUCATIONAL";
      } else if (fetchError.message?.includes('ECONNREFUSED')) {
        errorMessage = "Service temporarily unavailable";
        errorDetails = "The feedback system is temporarily down. Your progress is saved and you can continue learning or try again shortly.";
        errorCode = "SERVICE_DOWN";
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          code: errorCode,
          status: "error" 
        },
        { status: 503 } // Service Unavailable
      )
    }
  } catch (error: any) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error", status: "error" },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Check if the backend is running
    const backendUrl = process.env.BACKEND_URL || 'https://solbot-backend.onrender.com'
    const healthEndpoint = '/health'
    const fullUrl = `${backendUrl}${healthEndpoint}`
    
    console.log(`Checking backend health at ${fullUrl}`)
    
    try {
      const backendResponse = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Use a timeout of 2 seconds
        signal: AbortSignal.timeout(2000)
      })
      
      console.log(`Backend health response status: ${backendResponse.status}`)
      
      // Return backend status
      if (backendResponse.ok) {
        return NextResponse.json({ status: "healthy", backend: "connected" })
      } else {
        return NextResponse.json(
          { status: "unhealthy", backend: "error", details: backendResponse.statusText },
          { status: 200 } // We still return 200 to the frontend
        )
      }
    } catch (error: any) {
      console.error("Backend health check error:", error)
      return NextResponse.json(
        { status: "unhealthy", backend: "unreachable", details: error.message },
        { status: 200 } // We still return 200 to the frontend
      )
    }
  } catch (error: any) {
    console.error("Health check error:", error)
    return NextResponse.json(
      { status: "error", details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to get existing messages for a conversation
async function getExistingMessages(conversationId: string) {
  // Return empty array if database is disabled or Supabase is not initialized
  if (!isDatabaseEnabled || !supabase) {
    console.warn('Database disabled or not available, cannot fetch messages');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('conversation_id', conversationId)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return [];
    }
    
    return data?.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
} 
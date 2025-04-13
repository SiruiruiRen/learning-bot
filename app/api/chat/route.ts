import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error handling
let supabase: any = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase URL or key missing, database features will be disabled');
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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const endpoint = '/api/chat/'
    const fullUrl = `${backendUrl}${endpoint}`
    
    console.log(`Forwarding request to backend at ${fullUrl}`)

    try {
      // Forward the request to the backend with increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("API call timeout - aborting fetch");
        controller.abort();
      }, 60000); // 60 second timeout (increased from 20s)
      
      // Implement retry logic for more resilience
      let maxRetries = 2;
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
              // Wait for a short delay before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
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

      // Return the response to the client
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Backend connection error:", fetchError)
      
      // Provide more detailed error messages based on the error type
      let errorMessage = "Could not connect to backend server";
      let errorDetails = fetchError.message || "Connection failed";
      let errorCode = fetchError.cause?.code || "UNKNOWN";
      
      // More specific error messages for different error types
      if (fetchError.name === 'AbortError') {
        errorMessage = "The request timed out";
        errorDetails = "The server took too long to respond. Please try again.";
        errorCode = "TIMEOUT";
      } else if (fetchError.message?.includes('ECONNREFUSED')) {
        errorMessage = "Backend server is not running";
        errorDetails = "Please start the backend server and try again.";
        errorCode = "SERVER_DOWN";
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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const healthEndpoint = '/api/chat/health'
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
  // Return empty array if Supabase is not initialized
  if (!supabase) {
    console.warn('Supabase not available, cannot fetch messages');
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
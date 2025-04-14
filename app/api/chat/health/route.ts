import { NextRequest, NextResponse } from 'next/server';

// Maximum number of retries for backend health check
const MAX_RETRIES = 1;
const RETRY_DELAY = 500; // 500ms

// Helper function for retrying API calls
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying health check, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get backend URL from environment or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8090';
    console.log(`Checking backend health at ${backendUrl}/api/chat/health`);
    
    try {
      // Set a short timeout for the health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // Don't abort the controller, just log a warning
        console.log('Health check is taking longer than expected, but continuing...');
      }, 2000); // 2 second timeout for warning only
      
      // Attempt to connect to the backend health endpoint
      const response = await fetchWithRetry(`${backendUrl}/api/chat/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log(`Backend health response status: ${response.status}`);
      
      if (!response.ok) {
        console.warn(`Backend health check returned status: ${response.status}, but frontend is still functional`);
        // Still return healthy to avoid cascading errors
        // This makes the frontend more resilient to backend issues
        return NextResponse.json({ 
          status: "healthy",
          backend: "unavailable", 
          message: "Frontend is healthy but backend may be unavailable" 
        });
      }
      
      // Return healthy status
      return NextResponse.json({ 
        status: "healthy",
        backend: "available",
        message: "All systems operational" 
      });
      
    } catch (error) {
      console.warn('Error checking backend health, but frontend is still functional:', error);
      // Still return a 200 OK response to indicate the frontend API is working
      // This avoids cascading errors in the frontend UI
      return NextResponse.json({ 
        status: "healthy", 
        backend: "unavailable",
        message: "Frontend is healthy but backend cannot be reached" 
      });
    }
  } catch (error) {
    console.error('Unexpected error in health check:', error);
    // Only in case of a critical error in the frontend API itself do we return error status
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
} 
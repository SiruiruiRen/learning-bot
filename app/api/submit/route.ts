import { NextRequest, NextResponse } from 'next/server'

// Proxy API route that forwards learning objective submissions to the backend
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    console.log("Submit API route received request:", body)

    // Make sure we have required fields
    if (!body.user_id || !body.phase || !body.message) {
      console.error("Missing required fields in submit request:", body)
      return NextResponse.json(
        { error: "Missing required fields (user_id, phase, message)", status: "error" },
        { status: 400 }
      )
    }

    // Set the backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'
    const endpoint = '/api/chat/submit'
    const fullUrl = `${backendUrl}${endpoint}`
    
    console.log(`Forwarding submission to backend at ${fullUrl}`)

    // Add required fields for submission
    const submissionBody = {
      ...body,
      is_submission: true,
      submission_type: body.submission_type || "learning_objective"
    }

    try {
      // Forward the request to the backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const backendResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);

      // Log response status
      console.log(`Backend submit response status: ${backendResponse.status}`)

      // Handle different status codes
      if (!backendResponse.ok) {
        let errorText = await backendResponse.text()
        console.error("Backend submit error:", errorText)
        
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
      console.log("Backend submit response:", data)

      // Return the response to the client
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Backend connection error:", fetchError)
      return NextResponse.json(
        { 
          error: "Could not connect to backend server", 
          details: fetchError.message || "Connection failed",
          code: fetchError.cause?.code || "UNKNOWN",
          status: "error" 
        },
        { status: 503 } // Service Unavailable
      )
    }
  } catch (error: any) {
    console.error("API submit proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error", status: "error" },
      { status: 500 }
    )
  }
} 
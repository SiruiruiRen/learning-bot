import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://solbot-backend.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Forwarding onboarding request to backend:', BACKEND_URL);
    
    const response = await fetch(`${BACKEND_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          detail: errorData.detail || `Backend returned ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Onboarding proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        detail: error instanceof Error ? error.message : 'Failed to connect to backend service' 
      },
      { status: 500 }
    );
  }
}

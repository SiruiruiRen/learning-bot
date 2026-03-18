import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'https://solbot-backend.onrender.com';
  
  let backendStatus = 'unknown';
  try {
    const response = await fetch(`${backendUrl}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    backendStatus = response.ok ? 'healthy' : 'error';
  } catch (error) {
    console.error('Backend health check failed:', error);
    backendStatus = 'error';
  }
  
  return NextResponse.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    backend: backendStatus
  });
} 
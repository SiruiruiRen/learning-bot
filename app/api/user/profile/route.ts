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
      console.log('Supabase client initialized successfully in user profile API');
    } else {
      console.warn('Supabase URL or key missing in user profile API, database features will be disabled');
    }
  } else {
    console.log('Database functionality is explicitly disabled in user profile API by DATABASE_ENABLED=false');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client in user profile API:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Check if database features are enabled
    if (!isDatabaseEnabled || !supabase) {
      // Return mock data for initial deployment
      return NextResponse.json({ 
        success: true, 
        userId: 'mock-user-' + Date.now()
      });
    }

    const data = await request.json();
    const { email, full_name, education_level, background, preferences } = data;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking user:', findError);
      return NextResponse.json(
        { error: 'Failed to check user' },
        { status: 500 }
      );
    }

    let userId;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name,
          education_level,
          background,
          preferences,
          last_login: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        );
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          full_name: full_name || null,
          education_level: education_level || null,
          background: background || null,
          preferences: preferences || null,
          last_login: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      userId = newUser.id;
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if database features are enabled
    if (!isDatabaseEnabled || !supabase) {
      // Return mock data for initial deployment
      return NextResponse.json({
        id: 'mock-user-123',
        email: request.nextUrl.searchParams.get('email') || 'user@example.com',
        full_name: 'Demo User',
        education_level: 'University',
        background: 'Computer Science',
        preferences: { theme: 'dark', notifications: true },
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
    }

    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
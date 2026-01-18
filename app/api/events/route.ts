import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, event_type, phase, component, metadata } = body;

    if (!session_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: sessionData } = await supabase.from('sessions').select('user_id').eq('id', session_id).single();
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const userId = sessionData.user_id;

    // Master log for all interactions
    await supabase.from('content_interaction_logs').insert({
      session_id, user_id: userId, interaction_type: event_type,
      content_type: component, phase, component,
      interaction_data: metadata,
    });

    let responseData = { success: true };

    switch (event_type) {
      case 'video_watch_completed':
        await handleVideoEvent(session_id, userId, phase, metadata);
        break;
      case 'video_pause':
      case 'video_play':
      case 'video_rewind':
      case 'video_fast_forward':
      case 'video_loaded':
      case 'video_progress_milestone':
        await handleVideoInteraction(session_id, userId, phase, event_type, metadata);
        break;
      case 'chat_started':
        const chatData = await handleChatStarted(session_id, userId, phase, component);
        responseData = chatData;
        break;
      case 'chat_ended':
        await handleChatEnded(metadata.chat_analytics_id, metadata);
        break;
      case 'floating_chat_question':
      case 'floating_chat_response':
        await handleFloatingChatEvent(session_id, userId, phase, event_type, metadata);
        break;
      case 'chat_message':
        await handleChatMessage(session_id, userId, phase, component, metadata);
        break;
      case 'user_click':
        await handleUserClick(session_id, userId, phase, metadata);
        break;
      case 'revision_submitted':
        await handleRevisionEvent(session_id, userId, phase, component, metadata);
        break;
      case 'phase_completed':
        await handlePhaseCompleted(session_id, userId, phase);
        break;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

async function handleVideoEvent(sessionId: string, userId: string, phase: string, metadata: any) {
  const { video_title, total_watched_seconds, play_count, pause_count, seek_count } = metadata;
  await supabase.from('user_video_analytics').upsert({
    session_id: sessionId, user_id: userId, phase, video_name: video_title,
    watched_duration_seconds: Math.round(total_watched_seconds),
    completion_percentage: 100, play_count, pause_count, rewind_count: seek_count,
  }, { onConflict: 'session_id, video_name' });
}

async function handleChatStarted(sessionId: string, userId: string, phase: string, component: string) {
  const { data } = await supabase.from('user_chat_analytics').insert({
    session_id: sessionId, user_id: userId, phase, component,
    chat_start_time: new Date().toISOString(),
  }).select().single();
  return data;
}

async function handleChatEnded(chatAnalyticsId: string, metadata: any) {
  if (!chatAnalyticsId) return;
  const { data: existingEntry } = await supabase.from('user_chat_analytics').select('chat_start_time').eq('id', chatAnalyticsId).single();
  if (!existingEntry) return;

  const startTime = new Date(existingEntry.chat_start_time);
  const endTime = new Date();
  const duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

  await supabase.from('user_chat_analytics').update({
    chat_end_time: endTime.toISOString(),
    message_count: metadata.message_count,
    total_duration_seconds: duration_seconds,
  }).eq('id', chatAnalyticsId);
}

async function handleRevisionEvent(sessionId: string, userId: string, phase: string, component: string, metadata: any) {
  await supabase.from('user_revision_tracking').insert({
    session_id: sessionId, user_id: userId, phase, component,
    revision_number: metadata.attempt_number,
    content_changes: metadata.content_changes,
  });
}

async function handleVideoInteraction(sessionId: string, userId: string, phase: string, eventType: string, metadata: any) {
  // Update video analytics with interaction details
  const { video_title, current_time, total_watched_seconds, pause_count, seek_count, is_rewind } = metadata;
  
  if (video_title) {
    // Upsert video analytics with latest interaction
    await supabase.from('user_video_analytics').upsert({
      session_id: sessionId,
      user_id: userId,
      phase,
      video_name: video_title,
      watched_duration_seconds: Math.round(total_watched_seconds || 0),
      pause_count: pause_count || 0,
      rewind_count: is_rewind ? (seek_count || 0) : 0,
      fast_forward_count: !is_rewind ? (seek_count || 0) : 0,
      last_interaction_at: new Date().toISOString(),
      watch_patterns: metadata.watch_patterns || []
    }, { onConflict: 'session_id, video_name' });
  }
}

async function handleFloatingChatEvent(sessionId: string, userId: string, phase: string, eventType: string, metadata: any) {
  // Log floating chatbot interactions
  await supabase.from('user_chat_analytics').insert({
    session_id: sessionId,
    user_id: userId,
    phase,
    component: 'floating_chatbot',
    chat_start_time: eventType === 'floating_chat_question' ? new Date().toISOString() : null,
    message_count: 1,
    metadata: {
      event_type: eventType,
      content: eventType === 'floating_chat_question' ? metadata.question : metadata.response,
      timestamp: metadata.timestamp
    }
  });
}

async function handleChatMessage(sessionId: string, userId: string, phase: string, component: string, metadata: any) {
  // Log all chat messages (both user and AI) for complete conversation tracking
  await supabase.from('content_interaction_logs').insert({
    session_id: sessionId,
    user_id: userId,
    interaction_type: 'chat_message',
    content_type: component || 'chat',
    phase,
    component: component || 'chat',
    interaction_data: {
      role: metadata.role, // 'user' or 'assistant'
      content: metadata.content,
      timestamp: metadata.timestamp
    }
  });
}

async function handleUserClick(sessionId: string, userId: string, phase: string, metadata: any) {
  // Log all user clicks for detailed analytics
  await supabase.from('content_interaction_logs').insert({
    session_id: sessionId,
    user_id: userId,
    interaction_type: 'user_click',
    content_type: 'page_interaction',
    phase,
    component: metadata.pathname,
    interaction_data: {
      target_element: metadata.target_element,
      position: {
        x: metadata.x_position,
        y: metadata.y_position
      },
      timestamp: metadata.timestamp
    }
  });
}

async function handlePhaseCompleted(sessionId: string, userId: string, phase: string) {
    const { data: phaseData } = await supabase
      .from('user_engagement_sessions')
      .select('duration_seconds, activity_type')
      .eq('session_id', sessionId)
      .eq('phase', phase);

    const video_time_seconds = phaseData?.filter(d => d.activity_type === 'video').reduce((sum, d) => sum + (d.duration_seconds || 0), 0) || 0;
    const chat_time_seconds = phaseData?.filter(d => d.activity_type === 'chat').reduce((sum, d) => sum + (d.duration_seconds || 0), 0) || 0;
    const knowledge_check_time_seconds = phaseData?.filter(d => d.activity_type === 'knowledge_check').reduce((sum, d) => sum + (d.duration_seconds || 0), 0) || 0;

    await supabase.from('phase_completion_analytics').insert({
        session_id: sessionId, user_id: userId, phase,
        completed_successfully: true,
        phase_end_time: new Date().toISOString(),
        video_time_seconds,
        chat_time_seconds,
        knowledge_check_time_seconds,
        total_time_seconds: video_time_seconds + chat_time_seconds + knowledge_check_time_seconds,
    });
} 
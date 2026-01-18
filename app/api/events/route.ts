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
      case 'video_watch_started':
        await handleVideoEvent(session_id, userId, phase, metadata);
        break;
      case 'video_pause':
      case 'video_play':
      case 'video_rewind':
      case 'video_fast_forward':
      case 'video_loaded':
      case 'video_progress_milestone':
      case 'video_ended':
      case 'video_error':
      case 'video_seek':
        await handleVideoInteraction(session_id, userId, phase, event_type, metadata);
        break;
      case 'quiz_question_answered':
      case 'quiz_started':
      case 'quiz_completed':
        await handleQuizEvent(session_id, userId, phase, event_type, metadata);
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
      case 'next_button':
      case 'page_view':
      case 'phase_transition':
        await handleNavigationEvent(session_id, userId, phase, event_type, metadata);
        break;
      case 'form_input':
      case 'text_input':
        await handleUserInput(session_id, userId, phase, component, metadata);
        break;
      case 'revision_submitted':
        await handleRevisionEvent(session_id, userId, phase, component, metadata);
        break;
      case 'phase_completed':
        await handlePhaseCompleted(session_id, userId, phase);
        break;
      case 'feedback_style_view':
        await handleFeedbackStyleView(session_id, userId, phase, component, metadata);
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
  const { video_title, video_src, current_time, total_watched_seconds, pause_count, seek_count, is_rewind, duration } = metadata;
  
  // Log individual video interaction event
  await supabase.from('video_interaction_events').insert({
    session_id: sessionId,
    user_id: userId,
    phase: phase,
    video_name: video_title || 'Unknown',
    event_type: eventType.replace('video_', ''), // Remove 'video_' prefix
    playback_position: current_time || 0, // Use playback_position instead of current_time (PostgreSQL reserved keyword)
    total_watched_seconds: total_watched_seconds || 0,
    event_timestamp: metadata.timestamp || new Date().toISOString(),
    metadata: metadata
  });
  
  // Update video analytics summary
  if (video_title) {
    // Calculate completion percentage
    const completionPercentage = duration && total_watched_seconds 
      ? (total_watched_seconds / duration) * 100 
      : 0;
    
    // Upsert video analytics with latest interaction
    await supabase.from('user_video_analytics').upsert({
      session_id: sessionId,
      user_id: userId,
      phase,
      video_name: video_title,
      video_src: video_src,
      total_duration_seconds: duration ? Math.round(duration) : null,
      watched_duration_seconds: Math.round(total_watched_seconds || 0),
      completion_percentage: completionPercentage,
      pause_count: pause_count || 0,
      rewind_count: is_rewind ? (seek_count || 0) : 0,
      fast_forward_count: !is_rewind ? (seek_count || 0) : 0,
      seek_count: seek_count || 0,
      last_position: current_time || 0,
      last_interaction_at: new Date().toISOString(),
      watch_patterns: metadata.watch_patterns || [],
      completed_at: eventType === 'video_ended' ? new Date().toISOString() : null
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
      timestamp: metadata.timestamp,
      evaluation: metadata.evaluation, // Include scoring/feedback if available
      score: metadata.score
    }
  });

  // Also log user inputs if it's a user message
  if (metadata.role === 'user') {
    await supabase.from('user_inputs').insert({
      session_id: sessionId,
      user_id: userId,
      input_type: 'chat_message',
      field_name: component || 'chat',
      input_value: metadata.content,
      phase: phase,
      component: component || 'chat',
      is_submission: metadata.is_submission || false,
      attempt_number: metadata.attempt_number || 1,
      metadata: metadata,
      timestamp: metadata.timestamp || new Date().toISOString()
    });
  }

  // Update chat conversation record
  if (metadata.role === 'assistant' && metadata.evaluation) {
    // This is a feedback/assessment response
    await supabase.from('chat_conversations').upsert({
      session_id: sessionId,
      user_id: userId,
      phase: phase,
      component: component || 'chat',
      has_assessment: true,
      assessment_score: metadata.evaluation?.overall_score || metadata.score,
      assessment_feedback: metadata.content,
      evaluation_metadata: metadata.evaluation,
      conversation_end_time: metadata.timestamp || new Date().toISOString()
    }, { onConflict: 'session_id,phase,component' });
  }
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

  // Also log in click_events table for detailed click analysis
  const targetElement = metadata.target_element || {};
  await supabase.from('click_events').insert({
    session_id: sessionId,
    user_id: userId,
    click_type: targetElement.tag === 'button' ? 'button' : targetElement.tag === 'a' ? 'link' : 'element',
    element_tag: targetElement.tag,
    element_id: targetElement.id,
    element_class: targetElement.className,
    element_text: targetElement.text,
    button_text: targetElement.tag === 'button' ? targetElement.text : null,
    x_position: metadata.x_position,
    y_position: metadata.y_position,
    pathname: metadata.pathname,
    phase: phase,
    component: metadata.pathname,
    metadata: metadata,
    timestamp: metadata.timestamp || new Date().toISOString()
  });
}

async function handleNavigationEvent(sessionId: string, userId: string, phase: string, eventType: string, metadata: any) {
  // Log navigation events (Next button clicks, page views, phase transitions)
  await supabase.from('navigation_events').insert({
    session_id: sessionId,
    user_id: userId,
    event_type: eventType,
    from_path: metadata.from_path || metadata.previous_pathname,
    to_path: metadata.to_path || metadata.pathname,
    from_phase: metadata.from_phase,
    to_phase: metadata.to_phase || phase,
    button_text: metadata.button_text,
    button_id: metadata.button_id,
    time_on_page_seconds: metadata.time_on_page_seconds,
    metadata: metadata,
    timestamp: metadata.timestamp || new Date().toISOString()
  });

  // Also log as click event if it's a button click
  if (eventType === 'next_button') {
    await supabase.from('click_events').insert({
      session_id: sessionId,
      user_id: userId,
      click_type: 'navigation',
      element_tag: 'button',
      element_id: metadata.button_id,
      button_text: metadata.button_text,
      pathname: metadata.from_path,
      phase: metadata.from_phase,
      component: 'navigation',
      metadata: metadata,
      timestamp: metadata.timestamp || new Date().toISOString()
    });
  }
}

async function handleUserInput(sessionId: string, userId: string, phase: string, component: string, metadata: any) {
  // Log all user text inputs
  await supabase.from('user_inputs').insert({
    session_id: sessionId,
    user_id: userId,
    input_type: metadata.input_type || 'form_field',
    field_name: metadata.field_name,
    input_value: metadata.input_value || metadata.value,
    phase: phase,
    component: component,
    is_submission: metadata.is_submission || false,
    attempt_number: metadata.attempt_number || 1,
    metadata: metadata,
    timestamp: metadata.timestamp || new Date().toISOString()
  });
}

async function handleQuizEvent(sessionId: string, userId: string, phase: string, eventType: string, metadata: any) {
  if (eventType === 'quiz_question_answered') {
    // Log individual question attempt
    await supabase.from('knowledge_check_attempts').insert({
      session_id: sessionId,
      user_id: userId,
      phase: phase,
      question_id: metadata.question_id,
      question_text: metadata.question_text || metadata.question,
      question_type: metadata.question_type || 'multiple_choice',
      attempt_number: metadata.attempt_number || 1,
      selected_answer: metadata.selected_answer,
      correct_answer: metadata.correct_answer,
      is_correct: metadata.is_correct,
      time_to_answer_seconds: metadata.time_to_answer_seconds,
      time_to_first_interaction_seconds: metadata.time_to_first_interaction_seconds,
      confidence_level: metadata.confidence_level,
      help_used: metadata.help_used || false,
      answer_changed: metadata.answer_changed || false,
      answer_changes: metadata.answer_changes || [],
      thinking_time_seconds: metadata.thinking_time_seconds,
      options_shown: metadata.options || metadata.options_shown,
      explanation_viewed: metadata.explanation_viewed || false,
      retry_count: metadata.retry_count || 0,
      metadata: metadata
    });
  } else if (eventType === 'quiz_started') {
    // Create or update quiz session summary
    await supabase.from('quiz_session_summary').upsert({
      session_id: sessionId,
      user_id: userId,
      phase: phase,
      quiz_start_time: new Date().toISOString(),
      completed: false
    }, { onConflict: 'session_id,phase' });
  } else if (eventType === 'quiz_completed') {
    // Update quiz session summary with final results
    const { total_questions, correct_answers, incorrect_answers, total_time_seconds } = metadata;
    const accuracy = total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;
    
    await supabase.from('quiz_session_summary').upsert({
      session_id: sessionId,
      user_id: userId,
      phase: phase,
      total_questions: total_questions || 0,
      correct_answers: correct_answers || 0,
      incorrect_answers: incorrect_answers || 0,
      accuracy_percentage: accuracy,
      total_time_seconds: total_time_seconds,
      quiz_end_time: new Date().toISOString(),
      completed: true,
      metadata: metadata
    }, { onConflict: 'session_id,phase' });
  }
}

async function handleFeedbackStyleView(sessionId: string, userId: string, phase: string, component: string, metadata: any) {
  // Log feedback style view events for research
  await supabase.from('content_interaction_logs').insert({
    session_id: sessionId,
    user_id: userId,
    interaction_type: 'feedback_style_view',
    content_type: component || 'feedback',
    phase: phase,
    component: component || 'feedback',
    interaction_data: {
      view_type: metadata.view_type, // 'original' or 'alternative'
      style: metadata.style, // 'warm' or 'direct'
      evaluation_score: metadata.evaluation_score,
      evaluation_category: metadata.evaluation_category,
      previous_view_duration_seconds: metadata.previous_view_duration_seconds,
      timestamp: metadata.timestamp || new Date().toISOString()
    }
  });

  // Get the most recent assessment for this session/phase/component
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id')
    .eq('session_id', sessionId)
    .eq('phase', phase)
    .eq('component', component)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Log to dedicated feedback_style_views table if it exists
  try {
    await supabase.from('feedback_style_views').insert({
      session_id: sessionId,
      user_id: userId,
      assessment_id: assessment?.id || null,
      phase: phase,
      component: component || 'feedback',
      view_type: metadata.view_type,
      style_viewed: metadata.style,
      evaluation_score: metadata.evaluation_score,
      evaluation_category: metadata.evaluation_category,
      view_start_time: metadata.timestamp || new Date().toISOString(),
      view_duration_seconds: metadata.previous_view_duration_seconds,
      previous_view_duration_seconds: metadata.previous_view_duration_seconds
    });
  } catch (error) {
    // Table might not exist yet, log to user_inputs as fallback
    console.warn('feedback_style_views table not found, using user_inputs:', error);
    try {
      await supabase.from('user_inputs').insert({
        session_id: sessionId,
        user_id: userId,
        input_type: 'feedback_style_choice',
        field_name: 'feedback_style',
        input_value: metadata.style,
        phase: phase,
        component: component || 'feedback',
        metadata: {
          view_type: metadata.view_type,
          evaluation_score: metadata.evaluation_score,
          view_duration_seconds: metadata.previous_view_duration_seconds,
          timestamp: metadata.timestamp
        },
        timestamp: metadata.timestamp || new Date().toISOString()
      });
    } catch (fallbackError) {
      console.error('Error logging feedback style view to user_inputs:', fallbackError);
    }
  }
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

    // Get quiz time and score
    const { data: quizData } = await supabase
      .from('quiz_session_summary')
      .select('total_time_seconds, accuracy_percentage')
      .eq('session_id', sessionId)
      .eq('phase', phase)
      .single();
    
    const quiz_time_seconds = quizData?.total_time_seconds || 0;
    const quiz_score = quizData?.accuracy_percentage || null;

    await supabase.from('phase_completion_analytics').insert({
        session_id: sessionId, user_id: userId, phase,
        completed_successfully: true,
        phase_end_time: new Date().toISOString(),
        video_time_seconds,
        chat_time_seconds,
        knowledge_check_time_seconds,
        quiz_time_seconds,
        quiz_score: quiz_score,
        total_time_seconds: video_time_seconds + chat_time_seconds + knowledge_check_time_seconds + quiz_time_seconds,
    });
} 
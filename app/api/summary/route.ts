import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!sessionId && !userId) {
      return NextResponse.json({ error: 'session_id or user_id is required' }, { status: 400 });
    }

    // Get user info
    let finalUserId = userId;
    if (!finalUserId && sessionId) {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();
      finalUserId = sessionData?.user_id;
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user information
    const { data: userData } = await supabase
      .from('users')
      .select('name, email, profile_data')
      .eq('id', finalUserId)
      .single();

    // Get phase completion analytics
    const { data: phaseData } = await supabase
      .from('phase_completion_analytics')
      .select('*')
      .eq('session_id', sessionId || '')
      .order('phase', { ascending: true });

    // Get assessments with scores
    const { data: assessments } = await supabase
      .from('assessments')
      .select('phase, component, overall_score, attempt_number, evaluation, created_at')
      .eq('session_id', sessionId || '')
      .order('created_at', { ascending: true });

    // Get quiz scores
    const { data: quizScores } = await supabase
      .from('quiz_session_summary')
      .select('phase, accuracy_percentage, total_questions, correct_answers')
      .eq('session_id', sessionId || '');

    // Get video analytics
    const { data: videoData } = await supabase
      .from('user_video_analytics')
      .select('phase, video_name, completion_percentage, watched_duration_seconds')
      .eq('session_id', sessionId || '');

    // Get chat conversations
    const { data: chatData } = await supabase
      .from('chat_conversations')
      .select('phase, component, total_messages, assessment_score')
      .eq('session_id', sessionId || '');

    // Calculate summary statistics
    const totalTime = phaseData?.reduce((sum, p) => sum + (p.total_time_seconds || 0), 0) || 0;
    const phasesCompleted = phaseData?.filter(p => p.completed_successfully).length || 0;
    const averageScore = assessments?.length 
      ? assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length 
      : null;
    
    // Get first and last assessment scores for improvement calculation
    const sortedAssessments = assessments?.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ) || [];
    const firstScore = sortedAssessments[0]?.overall_score;
    const lastScore = sortedAssessments[sortedAssessments.length - 1]?.overall_score;
    const scoreImprovement = firstScore && lastScore ? lastScore - firstScore : null;

    // Get phase-specific data
    const phaseStats = phaseData?.map(phase => ({
      phase: phase.phase,
      timeSpent: phase.total_time_seconds || 0,
      score: phase.final_assessment_score,
      quizScore: quizScores?.find(q => q.phase === phase.phase)?.accuracy_percentage,
      revisions: phase.revision_count || 0,
      completed: phase.completed_successfully
    })) || [];

    // Get user's learning plan from messages (Phase 4 MCII)
    const { data: mciiMessages } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('session_id', sessionId || '')
      .eq('phase', 'phase4')
      .eq('component', 'mcii')
      .eq('role', 'user')
      .order('created_at', { ascending: true })
      .limit(10);

    return NextResponse.json({
      user: {
        name: userData?.name || 'Learner',
        email: userData?.email,
        profileData: userData?.profile_data
      },
      summary: {
        totalTimeSeconds: totalTime,
        totalTimeMinutes: Math.round(totalTime / 60),
        totalTimeHours: Math.round(totalTime / 3600 * 10) / 10,
        phasesCompleted,
        averageScore,
        scoreImprovement,
        firstScore,
        lastScore,
        totalAssessments: assessments?.length || 0,
        totalRevisions: phaseData?.reduce((sum, p) => sum + (p.revision_count || 0), 0) || 0
      },
      phaseStats,
      assessments: assessments?.map(a => ({
        phase: a.phase,
        component: a.component,
        score: a.overall_score,
        attempt: a.attempt_number,
        evaluation: a.evaluation,
        timestamp: a.created_at
      })) || [],
      quizScores: quizScores?.map(q => ({
        phase: q.phase,
        accuracy: q.accuracy_percentage,
        totalQuestions: q.total_questions,
        correctAnswers: q.correct_answers
      })) || [],
      videoStats: videoData?.map(v => ({
        phase: v.phase,
        videoName: v.video_name,
        completion: v.completion_percentage,
        timeWatched: v.watched_duration_seconds
      })) || [],
      chatStats: chatData?.map(c => ({
        phase: c.phase,
        component: c.component,
        messages: c.total_messages,
        score: c.assessment_score
      })) || [],
      learningPlan: mciiMessages || []
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}

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

    // Get all user chat messages from different phases
    const { data: allUserMessages } = await supabase
      .from('messages')
      .select('content, phase, component, created_at')
      .eq('session_id', sessionId || '')
      .eq('role', 'user')
      .order('created_at', { ascending: true });

    // Extract key information from different phases
    const taskAnalysisMessages = allUserMessages?.filter(m => 
      m.phase === 'phase2' && (m.component === 'learning_objectives' || m.component === 'chatbot')
    ) || [];
    
    const mciiMessages = allUserMessages?.filter(m => 
      m.phase === 'phase4' && m.component === 'mcii'
    ) || [];
    
    const monitoringMessages = allUserMessages?.filter(m => 
      m.phase === 'phase5' && (m.component === 'monitoring' || m.component === 'monitoring_adaptation')
    ) || [];

    // Combine all user content for AI analysis
    const allUserContent = [
      ...taskAnalysisMessages.map(m => `[Phase 2 - Task Analysis] ${m.content}`),
      ...mciiMessages.map(m => `[Phase 4 - MCII Plan] ${m.content}`),
      ...monitoringMessages.map(m => `[Phase 5 - Monitoring] ${m.content}`)
    ].join('\n\n');

    // Call backend to generate personalized insights using Claude
    let insights = null;
    if (allUserContent && allUserContent.length > 0) {
      try {
        const backendUrl = process.env.BACKEND_URL || 'https://solbot-backend.onrender.com';
        const insightsResponse = await fetch(`${backendUrl}/api/summary-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_content: allUserContent,
            user_name: userData?.name || 'Learner',
            phases_completed: phasesCompleted
          })
        });
        
        if (insightsResponse.ok) {
          insights = await insightsResponse.json();
        }
      } catch (error) {
        console.error('Error generating insights:', error);
        // Continue without insights if API fails
      }
    }

    // Extract keywords and key information manually if AI fails
    const extractedInfo = {
      taskAnalysis: {
        learningTask: taskAnalysisMessages.find(m => m.content.includes('learning') || m.content.includes('course'))?.content || '',
        resources: taskAnalysisMessages.find(m => m.content.includes('resource') || m.content.includes('material'))?.content || '',
        strategy: taskAnalysisMessages.find(m => m.content.includes('use') || m.content.includes('strategy'))?.content || ''
      },
      mciiPlan: {
        goal: mciiMessages[0]?.content || '',
        obstacles: mciiMessages.find(m => m.content.toLowerCase().includes('obstacle') || m.content.toLowerCase().includes('challenge'))?.content || '',
        intention: mciiMessages.find(m => m.content.toLowerCase().includes('if') && m.content.toLowerCase().includes('then'))?.content || ''
      },
      monitoring: {
        indicators: monitoringMessages.find(m => m.content.toLowerCase().includes('indicator') || m.content.toLowerCase().includes('track'))?.content || '',
        checkIns: monitoringMessages.find(m => m.content.toLowerCase().includes('check') || m.content.toLowerCase().includes('schedule'))?.content || ''
      }
    };

    return NextResponse.json({
      user: {
        name: userData?.name || 'Learner',
        email: userData?.email,
        profileData: userData?.profile_data
      },
      insights: insights || {
        keywords: extractKeywords(allUserContent),
        recommendations: generateRecommendations(extractedInfo, assessments || []),
        strengths: identifyStrengths(extractedInfo, assessments || []),
        nextSteps: generateNextSteps(extractedInfo, phasesCompleted)
      },
      extractedInfo,
      summary: {
        phasesCompleted,
        totalAssessments: assessments?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}

// Helper functions to extract insights from user content
function extractKeywords(content: string): string[] {
  if (!content || content.length === 0) return [];
  
  // Simple keyword extraction (can be enhanced with NLP)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !commonWords.has(w));
  
  // Get unique words and return top 10
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function generateRecommendations(extractedInfo: any, assessments: any[]): string[] {
  const recommendations: string[] = [];
  
  // Based on task analysis
  if (extractedInfo.taskAnalysis.learningTask && extractedInfo.taskAnalysis.learningTask.length > 0) {
    recommendations.push(`Focus on: ${extractedInfo.taskAnalysis.learningTask.substring(0, 100)}...`);
  }
  
  // Based on MCII plan
  if (extractedInfo.mciiPlan.goal && extractedInfo.mciiPlan.goal.length > 0) {
    recommendations.push(`Your goal: ${extractedInfo.mciiPlan.goal.substring(0, 100)}...`);
  }
  
  if (extractedInfo.mciiPlan.intention && extractedInfo.mciiPlan.intention.length > 0) {
    recommendations.push(`Implementation intention: ${extractedInfo.mciiPlan.intention.substring(0, 100)}...`);
  }
  
  // Based on assessment scores
  const lowScores = assessments.filter(a => a.overall_score && a.overall_score < 3);
  if (lowScores.length > 0) {
    recommendations.push('Consider revising areas where you received lower scores to strengthen your understanding.');
  }
  
  return recommendations;
}

function identifyStrengths(extractedInfo: any, assessments: any[]): string[] {
  const strengths: string[] = [];
  
  // High scores indicate strengths
  const highScores = assessments.filter(a => a.overall_score && a.overall_score >= 4);
  if (highScores.length > 0) {
    strengths.push(`Strong performance in ${highScores.length} assessment${highScores.length > 1 ? 's' : ''}`);
  }
  
  // Well-defined plans
  if (extractedInfo.mciiPlan.goal && extractedInfo.mciiPlan.goal.length > 50) {
    strengths.push('Clear and specific goal setting');
  }
  
  if (extractedInfo.mciiPlan.intention && extractedInfo.mciiPlan.intention.length > 50) {
    strengths.push('Well-structured implementation intentions');
  }
  
  return strengths;
}

function generateNextSteps(extractedInfo: any, phasesCompleted: number): string[] {
  const nextSteps: string[] = [];
  
  if (phasesCompleted < 5) {
    nextSteps.push('Complete remaining phases to build a comprehensive learning system');
  } else {
    nextSteps.push('Apply your learning system to your actual course work');
    nextSteps.push('Review and refine your monitoring strategies based on real-world results');
    nextSteps.push('Continue using evidence-based learning strategies in your studies');
  }
  
  return nextSteps;
}

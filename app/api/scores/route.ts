import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const phaseId = request.nextUrl.searchParams.get('phaseId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('assessments')
      .select(`
        id,
        score,
        feedback,
        assessed_at,
        assessed_by,
        rubrics(id, name, description, max_score, criteria),
        phase_progress!inner(
          id,
          phase_id,
          user_course_id,
          user_courses!inner(
            user_id
          )
        )
      `)
      .eq('phase_progress.user_courses.user_id', userId);

    if (phaseId) {
      query = query.eq('phase_progress.phase_id', phaseId);
    }

    const { data, error } = await query.order('assessed_at', { ascending: false });

    if (error) {
      console.error('Error fetching scores:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rubric scores' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in scores API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      userId, 
      phaseId, 
      rubricId, 
      score, 
      feedback, 
      assessedBy 
    } = data;

    if (!userId || !phaseId || !rubricId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'userId, phaseId, rubricId, and score are required' },
        { status: 400 }
      );
    }

    // Get phase progress ID
    const { data: phaseProgress, error: progressError } = await supabase
      .from('phase_progress')
      .select('id')
      .eq('phase_id', phaseId)
      .eq('user_course_id', (
        await supabase
          .from('user_courses')
          .select('id')
          .eq('user_id', userId)
          .single()
      ).data?.id)
      .single();

    if (progressError) {
      console.error('Error finding phase progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to find phase progress' },
        { status: 500 }
      );
    }

    // Create assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        phase_progress_id: phaseProgress.id,
        rubric_id: rubricId,
        score,
        feedback: feedback || null,
        assessed_by: assessedBy || 'system'
      })
      .select('id')
      .single();

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError);
      return NextResponse.json(
        { error: 'Failed to save assessment' },
        { status: 500 }
      );
    }

    // Calculate scaffolding level based on score
    const { data: rubric } = await supabase
      .from('rubrics')
      .select('max_score')
      .eq('id', rubricId)
      .single();

    let scaffoldingLevel = 1; // High scaffolding default
    
    if (rubric) {
      const percentScore = (score / rubric.max_score) * 100;
      
      if (percentScore >= 80) {
        scaffoldingLevel = 3; // Low scaffolding for high scores
      } else if (percentScore >= 60) {
        scaffoldingLevel = 2; // Medium scaffolding for moderate scores
      }
    }

    // Update the phase progress with new scaffolding level
    await supabase
      .from('phase_progress')
      .update({ current_scaffolding_level: scaffoldingLevel })
      .eq('id', phaseProgress.id);

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      scaffoldingLevel
    });
  } catch (error) {
    console.error('Error in scores API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
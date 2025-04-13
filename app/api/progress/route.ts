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
      console.log('Supabase client initialized successfully');
    } else {
      console.warn('Supabase URL or key missing in progress API, database features will be disabled');
    }
  } else {
    console.log('Database functionality is explicitly disabled by DATABASE_ENABLED=false');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client in progress API:', error);
}

export async function GET(request: NextRequest) {
  try {
    // Check if database features are enabled
    if (!isDatabaseEnabled || !supabase) {
      // Return mock data for initial deployment
      return NextResponse.json([
        {
          id: 'mock-course-1',
          started_at: new Date().toISOString(),
          completed_at: null,
          current_phase_id: 'phase-1',
          courses: {
            id: 'course-1',
            title: 'Example Course',
            description: 'A mock course for demonstration'
          },
          phases: [
            {
              id: 'progress-1',
              started_at: new Date().toISOString(),
              completed_at: null,
              current_scaffolding_level: 1,
              status: 'in_progress',
              learning_phases: {
                id: 'phase-1',
                name: 'Introduction Phase',
                description: 'Learn the basics',
                sequence_order: 1
              }
            }
          ]
        }
      ]);
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const courseId = request.nextUrl.searchParams.get('courseId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user course enrollment
    let courseQuery = supabase
      .from('user_courses')
      .select(`
        id,
        started_at,
        completed_at,
        current_phase_id,
        courses(id, title, description),
        learning_phases(id, name, description, sequence_order)
      `)
      .eq('user_id', userId);

    if (courseId) {
      courseQuery = courseQuery.eq('course_id', courseId);
    }

    const { data: userCourses, error: courseError } = await courseQuery;

    if (courseError) {
      console.error('Error fetching courses:', courseError);
      return NextResponse.json(
        { error: 'Failed to fetch course progress' },
        { status: 500 }
      );
    }

    if (!userCourses || userCourses.length === 0) {
      return NextResponse.json(
        { error: 'No courses found for user' },
        { status: 404 }
      );
    }

    // Get phase progress
    const coursesWithPhases = await Promise.all(
      userCourses.map(async (course: any) => {
        const { data: phases, error: phaseError } = await supabase
          .from('phase_progress')
          .select(`
            id,
            started_at,
            completed_at,
            current_scaffolding_level,
            status,
            learning_phases(id, name, description, sequence_order)
          `)
          .eq('user_course_id', course.id)
          .order('learning_phases(sequence_order)', { ascending: true });

        if (phaseError) {
          console.error('Error fetching phases:', phaseError);
          return {
            ...course,
            phases: []
          };
        }

        return {
          ...course,
          phases: phases || []
        };
      })
    );

    return NextResponse.json(coursesWithPhases);
  } catch (error) {
    console.error('Error in progress API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if database features are enabled
    if (!isDatabaseEnabled || !supabase) {
      // Return success with mock data for initial deployment
      return NextResponse.json({
        success: true,
        progressId: 'mock-progress-' + Date.now(),
        status: 'in_progress',
        scaffoldingLevel: 1
      });
    }

    const data = await request.json();
    const { userId, phaseId, courseId, status, scaffoldingLevel } = data;

    if (!userId || !phaseId) {
      return NextResponse.json(
        { error: 'userId and phaseId are required' },
        { status: 400 }
      );
    }

    // Get user's course
    let userCourseId;
    
    if (courseId) {
      const { data: userCourse, error: courseError } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (courseError) {
        return NextResponse.json(
          { error: 'Failed to find user course' },
          { status: 500 }
        );
      }
      
      userCourseId = userCourse.id;
    } else {
      // Get first course if not specified
      const { data: userCourse, error: courseError } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (courseError) {
        return NextResponse.json(
          { error: 'Failed to find user course' },
          { status: 500 }
        );
      }
      
      userCourseId = userCourse.id;
    }

    // Check if phase progress exists
    const { data: existingProgress, error: progressError } = await supabase
      .from('phase_progress')
      .select('id, status, current_scaffolding_level, completed_at')
      .eq('user_course_id', userCourseId)
      .eq('phase_id', phaseId)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Error checking progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to check phase progress' },
        { status: 500 }
      );
    }

    let progressId;
    let progressUpdate = {};
    
    // Set fields to update
    if (status) {
      progressUpdate = { ...progressUpdate, status };
      
      // If status is completed, set completion date
      if (status === 'completed') {
        progressUpdate = { 
          ...progressUpdate, 
          completed_at: new Date().toISOString() 
        };
      }
    }
    
    if (scaffoldingLevel) {
      progressUpdate = { 
        ...progressUpdate, 
        current_scaffolding_level: scaffoldingLevel 
      };
    }

    if (existingProgress) {
      // Update existing progress
      progressId = existingProgress.id;
      
      const { error: updateError } = await supabase
        .from('phase_progress')
        .update(progressUpdate)
        .eq('id', progressId);

      if (updateError) {
        console.error('Error updating progress:', updateError);
        return NextResponse.json(
          { error: 'Failed to update phase progress' },
          { status: 500 }
        );
      }
    } else {
      // Create new progress
      const { data: newProgress, error: createError } = await supabase
        .from('phase_progress')
        .insert({
          user_course_id: userCourseId,
          phase_id: phaseId,
          status: status || 'in_progress',
          current_scaffolding_level: scaffoldingLevel || 1,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating progress:', createError);
        return NextResponse.json(
          { error: 'Failed to create phase progress' },
          { status: 500 }
        );
      }

      progressId = newProgress.id;
    }

    // If status is completed, update user_courses.current_phase_id to next phase
    if (status === 'completed') {
      try {
        // Get next phase
        const { data: currentPhase } = await supabase
          .from('learning_phases')
          .select('sequence_order')
          .eq('id', phaseId)
          .single();
        
        if (currentPhase) {
          const { data: nextPhase } = await supabase
            .from('learning_phases')
            .select('id')
            .gt('sequence_order', currentPhase.sequence_order)
            .order('sequence_order', { ascending: true })
            .limit(1)
            .single();
          
          if (nextPhase) {
            await supabase
              .from('user_courses')
              .update({ current_phase_id: nextPhase.id })
              .eq('id', userCourseId);
          } else {
            // No next phase, mark course as completed
            await supabase
              .from('user_courses')
              .update({ completed_at: new Date().toISOString() })
              .eq('id', userCourseId);
          }
        }
      } catch (err) {
        console.error('Error updating next phase:', err);
        // Continue despite this error
      }
    }

    return NextResponse.json({
      success: true,
      progressId,
      status: status || (existingProgress?.status || 'in_progress'),
      scaffoldingLevel: scaffoldingLevel || (existingProgress?.current_scaffolding_level || 1)
    });
  } catch (error) {
    console.error('Error in progress API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
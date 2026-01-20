import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { end_time, message_count } = body;

        const { data: existingEntry, error: fetchError } = await supabase
            .from('user_chat_analytics')
            .select('chat_start_time')
            .eq('id', id)
            .single();

        if (fetchError || !existingEntry) {
            return NextResponse.json({ error: 'Chat analytics entry not found' }, { status: 404 });
        }

        const startTime = new Date(existingEntry.chat_start_time);
        const endTime = new Date(end_time);
        const duration_seconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

        const { data, error } = await supabase
            .from('user_chat_analytics')
            .update({
                chat_end_time: end_time,
                message_count,
                total_duration_seconds: duration_seconds,
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Maximum number of retries for backend API calls
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Define interface for backend request body
interface BackendRequestBody {
  user_id: string;
  phase: string;
  message: string;
  conversation_id?: string;
  raw_message?: string;
  component?: string;
  is_new_phase?: boolean;
}

// Helper function for retrying API calls
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying API call, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, phase, component, message, conversationId } = data;

    if (!userId || !phase || !message) {
      return NextResponse.json(
        { error: 'userId, phase, and message are required' },
        { status: 400 }
      );
    }

    // Log the request for debugging
    console.log(`Processing request: phase=${phase}, component=${component}, userId=${userId.slice(0,8)}...`);
    console.log(`Message: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);

    // For phase1, we'll handle it on the client side with predefined responses
    if (phase === 'phase1') {
      console.log('Using client-side handling for phase1');
      return NextResponse.json({
        success: true,
        data: {
          message: "This is handled on the client side for phase1",
          phase: phase,
          component: component
        }
      });
    }

    // Map frontend phase name to backend agent if needed
    let backendPhase = phase;
    if (phase === 'intro') {
      backendPhase = 'intro'; // 'intro' page uses intro agent
    } else if (phase === 'summary') {
      backendPhase = 'summary'; // 'summary' page uses the summary agent
    }

    // Backend API URL
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8081';
    console.log(`Connecting to backend API at ${backendUrl}/api/chat (Updated: ${new Date().toISOString()})`);
    
    try {
      // Set a reasonable timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);  // 20 second timeout
      
      // Prepare the request body
      const requestBody: BackendRequestBody = {
        user_id: userId,
        phase: backendPhase,
        message: message,
        conversation_id: conversationId,
        raw_message: message,
        component: component
      };
      
      console.log('Sending request to backend:', JSON.stringify(requestBody));
      
      // Always try to connect to the backend API without complex fallbacks
      console.log('Connecting to backend at:', `${backendUrl}/api/chat`);
      
      let response: Response;
      try {
        response = await fetchWithRetry(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        console.log(`Backend response status: ${response.status}`);

        if (!response.ok) {
          let errorDetails = '';
          try {
            errorDetails = await response.text();
            console.error(`Backend API error: ${response.status} - ${errorDetails}`);
          } catch (textError) {
            console.error(`Error reading response text: ${textError}`);
          }
          
          if (response.status === 404) {
            console.log('Endpoint not found, providing fallback response');
            return NextResponse.json({
              success: true,
              data: {
                message: "I'm sorry, but that resource is not available yet. Let's continue with what we have.",
                phase: phase,
                component: component,
                agent_type: "fallback",
                scaffolding_level: 2,
                timestamp: new Date().toISOString()
              }
            });
          }
          
          throw new Error(`Backend API error: ${response.status}`);
        }

        // Parse the JSON response
        let responseData;
        let formattedData;
        
        try {
          responseData = await response.json();
          console.log('Successfully parsed response JSON');
          console.log('Raw response data:', JSON.stringify(responseData));
          
          // Validate the response data
          if (!responseData) {
            console.error('Empty response from backend');
            throw new Error('Empty response from backend');
          }
          
          // Handle different response formats
          if (responseData.data && responseData.data.message) {
            // Standard format with nested data object
            console.log('Using standard format with nested data object');
            formattedData = responseData.data;
          } else if (responseData.message) {
            // Direct format without nested data (new format from real agents)
            console.log('Using direct format without nested data');
            
            // Clean the message if it contains JSON structure
            if (typeof responseData.message === 'string' && 
                (responseData.message.includes("message':") || 
                 responseData.message.includes('"message":') || 
                 responseData.message.includes("'agent_type':"))) {
              
              console.log('Detected JSON in message string, extracting content...');
              try {
                // Try to extract just the message content from the JSON string
                const match = responseData.message.match(/message['"]?\s*:\s*['"]([^'"]+)['"]/);
                if (match && match[1]) {
                  responseData.message = match[1];
                }
              } catch (jsonError) {
                console.log('Error parsing JSON in message, using as is');
              }
            }
            
            formattedData = responseData;
          } else {
            console.error('Invalid response format:', responseData);
            throw new Error('Invalid response format from backend');
          }
          
          // Ensure the response has all required fields
          if (!formattedData.message) {
            formattedData.message = "The server returned a response without a message.";
          }
          if (!formattedData.agent_type) {
            formattedData.agent_type = "fallback";
          }
          if (!formattedData.phase) {
            formattedData.phase = phase;
          }
          
          // Clean any remaining "Real Agent [GPT]:" prefixes that might have gotten through
          if (typeof formattedData.message === 'string') {
            // Remove any prefixes like "Real Agent [GPT]:" - make this more aggressive
            formattedData.message = formattedData.message.replace(/^.*?Real Agent(?:\s*\[GPT\])?:\s*/i, '');
            
            // First clean any CONTEXT blocks
            if (formattedData.message.includes('CONTEXT:')) {
              console.log('Detected CONTEXT in message, cleaning...');
              const parts = formattedData.message.split('CONTEXT:');
              if (parts.length > 1) {
                // Take the last part after all CONTEXT blocks
                formattedData.message = parts[parts.length - 1].trim();
              }
            }
            
            // Handle TASK blocks
            if (formattedData.message.includes('TASK:')) {
              console.log('Detected TASK in message, cleaning...');
              const parts = formattedData.message.split('TASK:');
              if (parts.length > 1) {
                // Look for content after instructions (usually after a !, . or ?)
                const taskContent = parts[parts.length - 1];
                const match = taskContent.match(/[\.!\?]\s*([^]*?)$/);
                if (match && match[1]) {
                  formattedData.message = match[1].trim();
                } else {
                  // If no clear ending found, just take everything after TASK
                  formattedData.message = taskContent.trim();
                }
              }
            }
            
            // Handle conversation stage instructions
            if (formattedData.message.includes('CONVERSATION STAGE:') || 
                formattedData.message.includes('CURRENT CONVERSATION STAGE:') || 
                formattedData.message.includes('NEXT STAGE:')) {
              console.log('Detected conversation stage instructions, cleaning more aggressively...');
              // Try to find the actual response after all instructions
              const match = formattedData.message.match(/Begin with a natural response without any introductory phrases\.\s*([^]*?)$/);
              if (match && match[1]) {
                formattedData.message = match[1].trim();
              } else {
                // Look for content after the last period, exclamation or question mark
                const match2 = formattedData.message.match(/[\.!\?]\s*([^]*?)$/);
                if (match2 && match2[1]) {
                  formattedData.message = match2[1].trim();
                }
              }
            }
            
            // Final cleanup for any non-alphanumeric prefixes
            formattedData.message = formattedData.message.replace(/^[^a-zA-Z0-9]+/, '');
            
            console.log('Cleaned message:', formattedData.message);
          }
          
          // For intro phase, ensure we have next_intro_stage when needed
          if (phase === 'intro' && !formattedData.next_intro_stage) {
            const componentToStageMap: Record<string, string> = {
              'welcome': 'name',
              'name': 'major',
              'major': 'challenging_course',
              'challenging_course': 'motivation',
              'motivation': 'srl_ability',
              'srl_ability': 'complete'
            };
            
            // Use the component to determine the next stage
            if (component && componentToStageMap[component]) {
              console.log(`Adding next_intro_stage: ${componentToStageMap[component]}`);
              formattedData.next_intro_stage = componentToStageMap[component];
            }
          }
          
          console.log('Final formatted data:', JSON.stringify(formattedData));
        } catch (jsonError) {
          console.error(`Error parsing response JSON: ${jsonError}`);
          throw new Error('Invalid JSON response from backend');
        }
        
        // Store the conversation history in Supabase if available
        try {
          if (supabase && conversationId) {
            await supabase.from('conversations').upsert({
              conversation_id: conversationId,
              user_id: userId,
              phase: phase,
              component: component || 'general',
              updated_at: new Date().toISOString(),
              messages: [
                ...(await getExistingMessages(conversationId) || []),
                { role: 'user', content: message, timestamp: new Date().toISOString() },
                { role: 'assistant', content: formattedData.message, timestamp: new Date().toISOString() }
              ]
            }, { onConflict: 'conversation_id' });
            console.log('Saved conversation to database');
          }
        } catch (dbError) {
          console.error('Error saving conversation to database:', dbError);
          // Continue even if database operation fails
        }

        // Format the response data for the frontend
        const formattedResponse = {
          success: true,
          data: {
            message: typeof formattedData.message === 'string' ? formattedData.message : 
                     typeof formattedData.message === 'object' && formattedData.message?.message ? 
                     formattedData.message.message : 
                     JSON.stringify(formattedData.message),
            agent_type: formattedData.agent_type || "ai_assistant",
            phase: formattedData.phase || phase,
            component: formattedData.component || component,
            scaffolding_level: formattedData.scaffolding_level || 2,
            next_component: formattedData.next_component,
            next_phase: formattedData.next_phase,
            next_intro_stage: formattedData.next_intro_stage,
            timestamp: new Date().toISOString()
          }
        };

        console.log('Formatted response for frontend:', JSON.stringify(formattedResponse, null, 2));

        // Return the formatted response with consistent structure
        return NextResponse.json(formattedResponse);
      } catch (error) {
        console.error(`Backend fetch error:`, error);
        console.log('Connection refused - backend may not be running');
        
        // Default to a simplified fallback response when the backend is unavailable
        return NextResponse.json({
          success: true,
          data: {
            message: "I'm sorry, but I'm unable to connect to the backend service right now. Please ensure the backend server is running.",
            phase: phase,
            component: component,
            agent_type: "fallback",
            scaffolding_level: 2,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error in chat API:', error);
      return NextResponse.json({
        success: true,
        data: {
          message: "I couldn't process that request properly. Let's try again or take a different approach.",
          agent_type: "error",
          phase: "unknown",
          component: null,
          scaffolding_level: 2,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json({
      success: true,
      data: {
        message: "I couldn't process that request properly. Let's try again or take a different approach.",
        agent_type: "error",
        phase: "unknown",
        component: null,
        scaffolding_level: 2,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Helper function to get existing messages for a conversation
async function getExistingMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('conversation_id', conversationId)
      .single();
    
    if (error) {
      return [];
    }
    
    return data?.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
} 
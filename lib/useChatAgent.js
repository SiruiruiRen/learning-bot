// Add a new function to handle phase transitions
export async function notifyPhaseTransition(userId, phase, component = "welcome") {
  console.log(`Notifying phase transition: ${phase}, component: ${component}`);
  
  try {
    // Create a special "__phase_intro__" message that signals phase entry
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        phase: phase,
        component: component,
        message: "__phase_intro__",
        conversationId: `${userId}-${phase}-${Date.now()}`
      }),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Phase transition API error (${response.status}): ${errorText}`);
      return {
        message: `Welcome to ${phase}! I'll help guide you through this part of your learning journey. (Fallback response - server connection issue)`,
        success: false,
        error: true,
        errorDetails: `HTTP ${response.status}: ${errorText}`
      };
    }

    // Safely parse JSON response
    try {
      const data = await response.json();
      console.log(`Phase transition response:`, data);
      
      // Check for successful response
      if (data.success === true && data.data) {
        return data.data;
      }
      
      // Check for error
      if (data.error) {
        console.error(`Phase transition error:`, data.error);
        return {
          message: data.message || `Welcome to ${phase}! I'll help guide you through this part of your learning journey. (Fallback - server error)`,
          success: false,
          error: true,
          errorDetails: data.error
        };
      }
      
      // Return either data.data or data as fallback
      return data.data || data;
    } catch (parseError) {
      console.error(`JSON parsing error:`, parseError);
      return {
        message: `Welcome to ${phase}! I'll help guide you through this part of your learning journey. (Fallback - JSON parse error)`,
        success: false,
        error: true,
        errorDetails: parseError.toString()
      };
    }
  } catch (error) {
    console.error('Error notifying phase transition:', error);
    return {
      message: `Welcome to ${phase}! I'll help guide you through this part of your learning journey. (Fallback - network error)`,
      success: false,
      error: true,
      errorDetails: error.toString()
    };
  }
} 
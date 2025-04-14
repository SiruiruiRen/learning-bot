/**
 * Data processing utilities for handling missing data in the SoLBot platform
 */

const { withDefaults } = require('./errorHandling');

/**
 * Default values for user records
 */
const USER_DEFAULTS = {
  full_name: 'Anonymous User',
  education_level: 'Not specified',
  background: 'Not specified',
  preferences: {}
};

/**
 * Default values for scaffolding levels
 */
const SCAFFOLDING_DEFAULTS = {
  level: 1, // Default to high support
  previousLevel: null,
  adaptationReason: 'Initial setting'
};

/**
 * Default values for course progress
 */
const PROGRESS_DEFAULTS = {
  status: 'in_progress',
  completionPercentage: 0,
  lastActiveTimestamp: new Date()
};

/**
 * Default values for conversations
 */
const CONVERSATION_DEFAULTS = {
  summary: '',
  context: {},
  agent_type: 'manager'
};

/**
 * Default values for messages
 */
const MESSAGE_DEFAULTS = {
  metadata: {},
  timestamp: new Date()
};

/**
 * Default values for assessment scores
 */
const ASSESSMENT_DEFAULTS = {
  score: 0,
  feedback: 'No feedback provided',
  assessed_by: 'system'
};

/**
 * Process user data to handle missing fields
 * @param {Object} userData - User data that might be incomplete
 * @returns {Object} Processed user data with defaults
 */
function processUserData(userData) {
  return withDefaults(userData, USER_DEFAULTS);
}

/**
 * Process phase progress data to handle missing fields
 * @param {Object} progressData - Phase progress data
 * @returns {Object} Processed progress data with defaults
 */
function processPhaseProgressData(progressData) {
  const withScaffolding = withDefaults(progressData, {
    current_scaffolding_level: 1,
    status: 'in_progress'
  });
  
  // Ensure scaffolding level is within valid range
  if (withScaffolding.current_scaffolding_level < 1) {
    withScaffolding.current_scaffolding_level = 1;
  } else if (withScaffolding.current_scaffolding_level > 3) {
    withScaffolding.current_scaffolding_level = 3;
  }
  
  return withScaffolding;
}

/**
 * Process conversation data to handle missing fields
 * @param {Object} conversationData - Conversation data
 * @returns {Object} Processed conversation data with defaults
 */
function processConversationData(conversationData) {
  return withDefaults(conversationData, CONVERSATION_DEFAULTS);
}

/**
 * Process message data to handle missing fields
 * @param {Object} messageData - Message data
 * @returns {Object} Processed message data with defaults
 */
function processMessageData(messageData) {
  const processed = withDefaults(messageData, MESSAGE_DEFAULTS);
  
  // Ensure sender_type is valid
  if (!processed.sender_type || !['user', 'agent'].includes(processed.sender_type)) {
    processed.sender_type = 'agent';
  }
  
  // Ensure agent_type is present for agent messages
  if (processed.sender_type === 'agent' && !processed.agent_type) {
    processed.agent_type = 'manager';
  }
  
  return processed;
}

/**
 * Process assessment data to handle missing fields
 * @param {Object} assessmentData - Assessment data
 * @returns {Object} Processed assessment data with defaults
 */
function processAssessmentData(assessmentData) {
  const processed = withDefaults(assessmentData, ASSESSMENT_DEFAULTS);
  
  // Ensure score is within valid range for the rubric
  if (!processed.rubric_id) {
    // Without a rubric reference, default to 0-10 scale
    if (processed.score < 0) processed.score = 0;
    if (processed.score > 10) processed.score = 10;
  }
  
  return processed;
}

/**
 * Clean JSONB data to ensure it's valid for storage
 * @param {Object|null|undefined} jsonData - Potentially invalid JSON data
 * @returns {Object} Valid JSON object
 */
function sanitizeJsonData(jsonData) {
  if (!jsonData) return {};
  
  try {
    // If it's a string, parse it to an object
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData);
    }
    
    // If it's already an object, return a clean copy
    return JSON.parse(JSON.stringify(jsonData));
  } catch (error) {
    console.warn('Invalid JSON data, returning empty object', error);
    return {};
  }
}

/**
 * Safely determine the current phase for a user in a course
 * @param {Object} userData - User data
 * @param {Object} courseData - Course data
 * @returns {Object} Current phase information
 */
function determineCurrentPhase(userData, courseData) {
  // If we have a current phase, use it
  if (courseData.current_phase_id) {
    return { 
      phase_id: courseData.current_phase_id,
      is_default: false
    };
  }
  
  // Otherwise default to the first phase
  return { 
    phase_id: null, // This will be resolved to the first phase by the database
    is_default: true
  };
}

/**
 * Determine appropriate scaffolding level based on assessment scores
 * @param {Array} assessments - Recent assessment records
 * @param {number} currentLevel - Current scaffolding level
 * @returns {Object} New scaffolding level and reason
 */
function determineScaffoldingLevel(assessments, currentLevel = 1) {
  if (!assessments || assessments.length === 0) {
    return { 
      level: currentLevel, 
      reason: 'No assessments available'
    };
  }
  
  // Calculate average score from recent assessments
  const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
  const averageScore = totalScore / assessments.length;
  
  // Determine scaffolding level based on average score
  // Assuming rubrics have max_score of 10
  if (averageScore >= 8) {
    return { 
      level: 3, // Low support
      reason: 'High performance in assessments'
    };
  } else if (averageScore >= 5) {
    return { 
      level: 2, // Medium support
      reason: 'Moderate performance in assessments'
    };
  } else {
    return { 
      level: 1, // High support
      reason: 'Additional support needed based on assessments'
    };
  }
}

/**
 * Create a safe database query with fallback values
 * @param {string} baseQuery - Original query
 * @param {Object} fallbackValues - Values to use when parameters are missing
 * @returns {Function} Function that safely executes the query
 */
function createSafeQuery(baseQuery, fallbackValues = {}) {
  return (client) => async (params = {}) => {
    // Apply defaults for any missing parameters
    const safeParams = withDefaults(params, fallbackValues);
    
    try {
      const result = await client.query(baseQuery, safeParams);
      return result.rows;
    } catch (error) {
      // Add a flag to indicate this is a database error
      error.isDbError = true;
      throw error;
    }
  };
}

module.exports = {
  USER_DEFAULTS,
  SCAFFOLDING_DEFAULTS,
  PROGRESS_DEFAULTS,
  CONVERSATION_DEFAULTS,
  MESSAGE_DEFAULTS,
  ASSESSMENT_DEFAULTS,
  processUserData,
  processPhaseProgressData,
  processConversationData,
  processMessageData,
  processAssessmentData,
  sanitizeJsonData,
  determineCurrentPhase,
  determineScaffoldingLevel,
  createSafeQuery
}; 
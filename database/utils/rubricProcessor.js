/**
 * Rubric processing utilities for the SoLBot Learning Platform
 * Handles scoring, scaffolding level determination, and rubric management
 */

const { withDefaults } = require('./errorHandling');

/**
 * Score ranges for rubric criteria
 */
const SCORE_RANGES = {
  '1-3': {
    min: 1,
    max: 3,
    labels: {
      1: 'Needs Improvement',
      2: 'Satisfactory',
      3: 'Excellent'
    }
  },
  '1-5': {
    min: 1,
    max: 5,
    labels: {
      1: 'Beginning',
      2: 'Developing',
      3: 'Satisfactory',
      4: 'Proficient',
      5: 'Excellent'
    }
  },
  '0-10': {
    min: 0,
    max: 10,
    labels: {
      0: 'Not Attempted',
      1: 'Very Poor',
      2: 'Poor',
      3: 'Below Average',
      4: 'Slightly Below Average',
      5: 'Average',
      6: 'Slightly Above Average',
      7: 'Above Average',
      8: 'Good',
      9: 'Very Good',
      10: 'Excellent'
    }
  }
};

/**
 * Scaffolding level descriptions
 */
const SCAFFOLDING_LEVELS = {
  1: {
    name: 'High Support',
    description: 'Provide structured templates, specific examples, and detailed guidance'
  },
  2: {
    name: 'Medium Support',
    description: 'Offer examples, highlight missing elements, and provide some guidance'
  },
  3: {
    name: 'Low Support', 
    description: 'Ask reflective questions and suggest minor refinements'
  }
};

/**
 * Default assessment data structure
 */
const DEFAULT_ASSESSMENT = {
  rubric_id: null,
  phase_progress_id: null,
  score: null,
  feedback: '',
  criterion_scores: []
};

/**
 * Map a score from one range to another (e.g., 0-10 to 1-3)
 * @param {number} score - Original score
 * @param {string} fromRange - Original range (e.g., '0-10')
 * @param {string} toRange - Target range (e.g., '1-3')
 * @returns {number} Mapped score
 */
function mapScore(score, fromRange, toRange) {
  const from = SCORE_RANGES[fromRange];
  const to = SCORE_RANGES[toRange];
  
  if (!from || !to) {
    throw new Error(`Invalid score range: ${fromRange} or ${toRange}`);
  }
  
  // Normalize to 0-1 range
  const normalized = (score - from.min) / (from.max - from.min);
  
  // Map to target range and round
  return Math.round(normalized * (to.max - to.min) + to.min);
}

/**
 * Calculate scaffolding level from a set of criterion scores
 * @param {Array} criterionScores - Array of criterion score objects
 * @param {string} method - Calculation method ('average', 'minimum', 'weighted')
 * @param {Object} weights - Optional weights for weighted calculation
 * @returns {number} Scaffolding level (1-3)
 */
function calculateScaffoldingLevel(criterionScores, method = 'average', weights = {}) {
  if (!criterionScores || criterionScores.length === 0) {
    return 1; // Default to highest support if no scores
  }
  
  // Make sure all scores are using 1-3 scale
  const normalizedScores = criterionScores.map(cs => {
    // If the score is already 1-3, use as is
    if (cs.score >= 1 && cs.score <= 3) {
      return {
        ...cs,
        normalizedScore: cs.score
      };
    }
    
    // Otherwise map to 1-3 scale
    return {
      ...cs,
      normalizedScore: mapScore(cs.score, '0-10', '1-3') // Assuming original is 0-10
    };
  });
  
  if (method === 'minimum') {
    // Use minimum score method (ensures weakest areas get sufficient support)
    return Math.min(...normalizedScores.map(cs => cs.normalizedScore));
  } 
  else if (method === 'weighted') {
    // Use weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    
    normalizedScores.forEach(cs => {
      const weight = weights[cs.criterion_id] || 1;
      totalWeight += weight;
      weightedSum += cs.normalizedScore * weight;
    });
    
    return Math.round(weightedSum / totalWeight);
  }
  else {
    // Default: use average method
    const sum = normalizedScores.reduce((acc, cs) => acc + cs.normalizedScore, 0);
    return Math.round(sum / normalizedScores.length);
  }
}

/**
 * Generate feedback based on criterion scores
 * @param {Array} criterionScores - Array of criterion score objects with criterion data
 * @param {number} scaffoldingLevel - Calculated scaffolding level (1-3)
 * @returns {Object} Feedback object with overall and criterion-specific feedback
 */
function generateFeedback(criterionScores, scaffoldingLevel) {
  if (!criterionScores || criterionScores.length === 0) {
    return {
      overall: 'No criteria have been assessed yet.',
      details: []
    };
  }
  
  // Generate criterion-specific feedback
  const details = criterionScores.map(cs => {
    const score = cs.score;
    const name = cs.criterion?.name || 'Unknown criterion';
    const description = cs.criterion?.description || '';
    
    let feedback = '';
    
    // Generate feedback based on score and scaffolding level
    if (score === 1) {
      // Needs improvement feedback
      feedback = scaffoldingLevel === 1 
        ? `This area needs significant improvement. Let's work on developing your ${name.toLowerCase()} with some examples and templates.`
        : `Consider revising your approach to ${name.toLowerCase()}. You might want to make it more specific.`;
    } else if (score === 2) {
      // Satisfactory feedback
      feedback = `Your ${name.toLowerCase()} is satisfactory, but could be strengthened by adding more detail.`;
    } else if (score === 3) {
      // Excellent feedback
      feedback = `Excellent work on ${name.toLowerCase()}! You've demonstrated a strong understanding of this concept.`;
    }
    
    return {
      criterion_id: cs.criterion_id,
      name,
      score,
      feedback
    };
  });
  
  // Generate overall feedback
  let overall = '';
  const avgScore = criterionScores.reduce((sum, cs) => sum + cs.score, 0) / criterionScores.length;
  
  if (avgScore < 1.5) {
    overall = `You're making progress, but there are several areas that need improvement. I'll provide detailed guidance to help you strengthen your work.`;
  } else if (avgScore < 2.5) {
    overall = `Good work overall! You've demonstrated satisfactory understanding in most areas. With some refinement, you can enhance your work further.`;
  } else {
    overall = `Excellent work! You've demonstrated strong understanding across all areas. Let's continue to build on this solid foundation.`;
  }
  
  return {
    overall,
    details
  };
}

/**
 * Process an assessment with criterion scores
 * @param {Object} assessmentData - Assessment data with criteria scores
 * @returns {Object} Processed assessment with overall score and feedback
 */
function processAssessment(assessmentData) {
  const assessment = withDefaults(assessmentData, DEFAULT_ASSESSMENT);
  
  // Calculate scaffolding level if criterion scores are available
  if (assessment.criterion_scores && assessment.criterion_scores.length > 0) {
    // Calculate overall score from criterion scores
    const criterionScores = assessment.criterion_scores;
    const method = assessment.scoring_method || 'average';
    
    // Calculate average score (1-3 scale)
    const sum = criterionScores.reduce((acc, cs) => acc + cs.score, 0);
    const avgScore = sum / criterionScores.length;
    
    // Set overall score
    assessment.score = Math.round(avgScore);
    
    // Determine scaffolding level
    assessment.scaffolding_level = calculateScaffoldingLevel(criterionScores, method);
    
    // Generate feedback
    const feedback = generateFeedback(criterionScores, assessment.scaffolding_level);
    assessment.feedback = feedback.overall;
    assessment.detailed_feedback = feedback.details;
  }
  
  return assessment;
}

/**
 * Format criterion data for database storage
 * @param {Object} criterionData - Raw criterion data
 * @returns {Object} Formatted criterion data
 */
function formatCriterionData(criterionData) {
  return {
    name: criterionData.name,
    description: criterionData.description || '',
    max_score: criterionData.max_score || 3,
    weight: criterionData.weight || 1.0,
    required: criterionData.required !== false
  };
}

/**
 * Get scaffolding recommendations based on level and phase
 * @param {number} level - Scaffolding level (1-3)
 * @param {string} phase - Learning phase name
 * @param {string} criterionName - Optional criterion name for specific recommendations
 * @returns {Object} Scaffolding recommendations
 */
function getScaffoldingRecommendations(level, phase, criterionName = null) {
  // Default recommendations
  const defaultRecommendations = {
    1: 'Provide structured templates, specific examples, and detailed guidance',
    2: 'Offer examples, highlight missing elements, and provide some guidance',
    3: 'Ask reflective questions and suggest minor refinements'
  };
  
  // Phase-specific recommendations
  const phaseRecommendations = {
    'Learning Objectives Definition': {
      1: 'Provide structured templates with blanks to fill in, specific examples for each component, and guided questions for each element',
      2: 'Offer examples of strong objectives, highlight missing elements, provide sentence starters',
      3: 'Ask reflective questions about how to strengthen the objective, suggest minor refinements'
    },
    'Goal Setting': {
      1: 'Provide goal templates, specific examples, step-by-step goal building process, visual timeline tools',
      2: 'Offer partial examples with guided questions to complete missing elements',
      3: 'Ask refining questions, provide light feedback on specificity or measurability'
    },
    'Monitoring & Adaptation': {
      1: 'Provide monitoring templates, scheduling tools, decision trees for follow-up actions, specific examples',
      2: 'Offer examples of strong monitoring questions, suggest scheduling approaches',
      3: 'Ask refining questions, suggest minor improvements to existing plan'
    }
  };
  
  // Criterion-specific recommendations
  const criterionRecommendations = {
    'Specificity': {
      1: 'Provide examples of specific objectives with clear, measurable outcomes',
      2: 'Suggest adding an action verb and measurable outcome',
      3: 'Ask how the specificity could be further enhanced'
    },
    'Resource Diversity': {
      1: 'Provide a list of diverse resource types and examples of each',
      2: 'Suggest adding 1-2 additional resource types to complement existing ones',
      3: 'Ask reflective questions about potential gaps in resource types'
    },
    'SMART Elements': {
      1: 'Provide a SMART goal template with examples for each element',
      2: 'Highlight which SMART elements are missing and provide examples',
      3: 'Ask focused questions about strengthening specific SMART elements'
    }
  };
  
  // Return appropriate recommendations based on available information
  if (criterionName && criterionRecommendations[criterionName]) {
    return criterionRecommendations[criterionName][level] || defaultRecommendations[level];
  } else if (phase && phaseRecommendations[phase]) {
    return phaseRecommendations[phase][level] || defaultRecommendations[level];
  } else {
    return defaultRecommendations[level];
  }
}

module.exports = {
  SCORE_RANGES,
  SCAFFOLDING_LEVELS,
  mapScore,
  calculateScaffoldingLevel,
  generateFeedback,
  processAssessment,
  formatCriterionData,
  getScaffoldingRecommendations
}; 
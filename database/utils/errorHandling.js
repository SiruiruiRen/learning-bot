/**
 * Database error handling utilities for SoLBot
 */

/**
 * Standard error codes and messages
 */
const errorCodes = {
  MISSING_DATA: 'MISSING_DATA',
  CONNECTION_ERROR: 'CONNECTION_ERROR', 
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

/**
 * Handles database errors gracefully
 * @param {Error} error - The error object from database operation
 * @param {string} operation - Description of the operation being performed
 * @returns {Object} Standardized error object
 */
function handleDatabaseError(error, operation) {
  console.error(`Database error during ${operation}:`, error);
  
  // Detect specific error types from Postgres/Supabase
  if (error.code === '23505') {
    // Unique violation
    return {
      code: errorCodes.VALIDATION_ERROR,
      message: 'A record with this identifier already exists',
      details: error.detail || ''
    };
  }
  
  if (error.code === '23503') {
    // Foreign key violation
    return {
      code: errorCodes.VALIDATION_ERROR,
      message: 'Referenced record does not exist',
      details: error.detail || ''
    };
  }
  
  if (error.code === '23502') {
    // Not null violation
    return {
      code: errorCodes.MISSING_DATA,
      message: 'Required data is missing',
      details: error.column ? `Missing field: ${error.column}` : ''
    };
  }
  
  if (error.code?.startsWith('08')) {
    // Connection errors
    return {
      code: errorCodes.CONNECTION_ERROR,
      message: 'Database connection error',
      details: error.message || ''
    };
  }
  
  if (error.code?.startsWith('42')) {
    // Syntax or permission errors
    return {
      code: errorCodes.SERVER_ERROR,
      message: 'Database query error',
      details: error.message || ''
    };
  }
  
  // Default to generic error
  return {
    code: errorCodes.SERVER_ERROR,
    message: 'An unexpected database error occurred',
    details: error.message || ''
  };
}

/**
 * Middleware for handling database errors in API routes
 */
function databaseErrorMiddleware(err, req, res, next) {
  if (err.isDbError) {
    const formattedError = handleDatabaseError(err, req.path);
    
    return res.status(getStatusCodeForError(formattedError.code)).json({
      error: formattedError
    });
  }
  
  next(err);
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode) {
  switch (errorCode) {
    case errorCodes.MISSING_DATA:
    case errorCodes.VALIDATION_ERROR:
      return 400; // Bad Request
    case errorCodes.NOT_FOUND:
      return 404; // Not Found
    case errorCodes.PERMISSION_ERROR:
      return 403; // Forbidden
    case errorCodes.CONNECTION_ERROR:
    case errorCodes.SERVER_ERROR:
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Wraps a database operation with error handling
 * @param {Function} dbOperation - Async function that performs a database operation
 * @param {string} operationName - Name of the operation for error logging
 * @returns {Function} Wrapped function that handles errors
 */
function withErrorHandling(dbOperation, operationName) {
  return async (...args) => {
    try {
      return await dbOperation(...args);
    } catch (error) {
      error.isDbError = true;
      console.error(`Error in database operation ${operationName}:`, error);
      throw error;
    }
  };
}

/**
 * Safely performs database transactions with proper cleanup
 * @param {Function} client - Database client
 * @param {Function} operation - Async function that performs the transactional operations
 * @returns {Promise} Results of the operation
 */
async function performTransaction(client, operation) {
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    error.isDbError = true;
    throw error;
  }
}

/**
 * Safely retrieves a record by ID with proper error handling
 * @param {Function} queryFn - Function to perform the query
 * @param {string} id - ID of the record to retrieve
 * @param {string} entityName - Name of the entity for error messages
 * @returns {Promise<Object>} The retrieved record
 */
async function safelyGetById(queryFn, id, entityName) {
  try {
    const result = await queryFn(id);
    
    if (!result || result.length === 0) {
      const error = new Error(`${entityName} not found`);
      error.code = errorCodes.NOT_FOUND;
      error.isDbError = true;
      throw error;
    }
    
    return result;
  } catch (error) {
    if (!error.isDbError) {
      error.isDbError = true;
    }
    throw error;
  }
}

/**
 * Handles missing fields by providing defaults
 * @param {Object} data - Data object that might have missing fields
 * @param {Object} defaults - Default values for missing fields
 * @returns {Object} Data with defaults applied for missing fields
 */
function withDefaults(data, defaults) {
  if (!data) return defaults;
  
  const result = { ...data };
  Object.entries(defaults).forEach(([key, defaultValue]) => {
    if (result[key] === undefined || result[key] === null) {
      result[key] = defaultValue;
    }
  });
  
  return result;
}

module.exports = {
  errorCodes,
  handleDatabaseError,
  databaseErrorMiddleware,
  withErrorHandling,
  performTransaction,
  safelyGetById,
  withDefaults
}; 
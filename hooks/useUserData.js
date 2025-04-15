'use client';

import { useState, useCallback } from 'react';

/**
 * Hook for collecting user data
 * 
 * @returns {Object} Methods and state for user data operations
 */
export function useUserData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Save user data
   * 
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data being collected
   * @param {string} value - Value to store
   * @param {Object} metadata - Additional context about the data (optional)
   * @returns {Promise<Object>} Result of the operation
   */
  const saveUserData = useCallback(async (userId, dataType, value, metadata = null) => {
    if (!userId) {
      const error = new Error('userId is required');
      setError(error);
      return { success: false, error };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get email from localStorage if available
      let userEmail = null;
      try {
        userEmail = localStorage.getItem('solbot_user_email');
      } catch (e) {
        // Ignore errors accessing localStorage
      }
      
      // Merge with existing metadata
      const finalMetadata = {
        ...(metadata || {}),
      };
      
      // Only add email if available
      if (userEmail) {
        finalMetadata.email = userEmail;
      }
      
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          dataType,
          value,
          metadata: finalMetadata
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user data');
      }
      
      return data;
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Get user data
   * 
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data to filter (optional)
   * @returns {Promise<Array>} User data items
   */
  const getUserData = useCallback(async (userId, dataType = null) => {
    if (!userId) {
      const error = new Error('userId is required');
      setError(error);
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/user-data?userId=${encodeURIComponent(userId)}`;
      if (dataType) {
        url += `&dataType=${encodeURIComponent(dataType)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get user data');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error getting user data:', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Track a user interaction event
   * 
   * @param {string} userId - User ID
   * @param {string} eventType - Type of event (click, view, etc)
   * @param {Object} eventData - Data about the event
   * @returns {Promise<Object>} Result of the operation
   */
  const trackEvent = useCallback(async (userId, eventType, eventData = {}) => {
    // Try to get email from localStorage if available
    let userEmail = null;
    try {
      userEmail = localStorage.getItem('solbot_user_email');
    } catch (e) {
      // Ignore errors accessing localStorage
    }
    
    const metadata = {
      timestamp: new Date().toISOString(),
      ...eventData
    };
    
    // Only add email if available
    if (userEmail) {
      metadata.email = userEmail;
    }
    
    return saveUserData(
      userId,
      'event',
      eventType,
      metadata
    );
  }, [saveUserData]);
  
  return {
    saveUserData,
    getUserData,
    trackEvent,
    loading,
    error
  };
} 
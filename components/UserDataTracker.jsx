'use client';

import { useUserData } from '@/hooks/useUserData';
import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Component that tracks user data and page views
 * This is invisible and can be added to layouts
 */
export function UserDataTracker() {
  const { trackEvent } = useUserData();
  const pathname = usePathname();
  
  // Get user ID from localStorage
  const getUserId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }, []);
  
  // Track page view on route change
  useEffect(() => {
    const userId = getUserId();
    
    // Skip tracking for API routes
    if (pathname.startsWith('/api/')) return;
    
    // Track the page view
    trackEvent(userId, 'page_view', {
      path: pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    
    // Track session start if first page view
    const sessionStarted = sessionStorage.getItem('sessionStarted');
    if (!sessionStarted) {
      trackEvent(userId, 'session_start', {
        firstPath: pathname,
        timestamp: new Date().toISOString(),
      });
      sessionStorage.setItem('sessionStarted', 'true');
    }
  }, [pathname, trackEvent, getUserId]);
  
  // Monitor when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userId = getUserId();
      
      // This won't actually be sent in many cases due to how
      // beforeunload works, but we'll try anyway
      trackEvent(userId, 'page_exit', {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, trackEvent, getUserId]);
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Hook to track interaction events
 */
export function useTrackInteraction() {
  const { trackEvent } = useUserData();
  const pathname = usePathname();
  
  // Get user ID from localStorage
  const getUserId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }, []);
  
  // Function to track a button click or other interaction
  const trackInteraction = useCallback((
    interactionType,
    elementId,
    additionalData = {}
  ) => {
    const userId = getUserId();
    
    trackEvent(userId, interactionType, {
      elementId,
      path: pathname,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }, [getUserId, trackEvent, pathname]);
  
  return trackInteraction;
}

/**
 * Button that tracks clicks with user data collection
 */
export function TrackedButton({ 
  children, 
  id, 
  onClick, 
  trackingData = {},
  ...props 
}) {
  const trackInteraction = useTrackInteraction();
  
  const handleClick = (e) => {
    // Track the interaction
    trackInteraction('button_click', id, trackingData);
    
    // Call the original onClick handler if provided
    if (onClick) onClick(e);
  };
  
  return (
    <button id={id} onClick={handleClick} {...props}>
      {children}
    </button>
  );
} 
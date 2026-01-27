"use client";

import { useRef, useEffect, useCallback, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  onComplete: () => void;
  startTime?: number;
  phase?: string;
  videoTitle?: string;
}

export default function VideoPlayer({ 
  src, 
  onComplete, 
  startTime = 0,
  phase = 'unknown',
  videoTitle = 'Unknown Video'
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasStartedTracking, setHasStartedTracking] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [seekCount, setSeekCount] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const lastTimeRef = useRef(0);
  const totalWatchedTime = useRef(0);
  const watchStartTime = useRef<number | null>(null);

  // Get session ID from localStorage
  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem('session_id');
      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
    } catch (error) {
      console.error('Error getting session ID:', error);
    }
  }, []);

  // Log analytics event to Supabase
  const logAnalyticsEvent = useCallback(async (eventType: string, metadata: any = {}) => {
    if (!sessionId) return;

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventType,
          phase: phase,
          component: 'video_player',
          metadata: {
            video_title: videoTitle,
            video_src: src,
            ...metadata
          }
        })
      });
    } catch (error) {
      console.error(`Failed to log ${eventType} event:`, error);
    }
  }, [sessionId, phase, videoTitle, src]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (startTime > 0) {
        video.currentTime = startTime;
      }
      
      setVideoLoaded(true);
      setVideoError(null);
      
      // Log video metadata
      logAnalyticsEvent('video_loaded', {
        duration: video.duration,
        start_time: startTime
      });
    }
  }, [startTime, logAnalyticsEvent]);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (video && video.error) {
      const errorCode = video.error.code;
      const errorMessage = video.error.message;
      
      let userFriendlyMessage = '';
      switch (errorCode) {
        case MediaError.MEDIA_ERR_ABORTED:
          userFriendlyMessage = 'Video loading was aborted. Please try refreshing the page.';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          userFriendlyMessage = 'Network error occurred while loading video. Please check your internet connection.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          userFriendlyMessage = 'Video file is corrupted or unsupported format.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          userFriendlyMessage = 'Video file not found or format not supported.';
          break;
        default:
          userFriendlyMessage = 'An unknown error occurred while loading the video.';
      }
      
      setVideoError(userFriendlyMessage);
      console.error(`Video error in ${phase}: Code ${errorCode} - ${errorMessage}`, { src, videoTitle });
      
      logAnalyticsEvent('video_error', {
        error_code: errorCode,
        error_message: errorMessage,
        user_friendly_message: userFriendlyMessage
      });
    }
  }, [logAnalyticsEvent, phase, src, videoTitle]);

  const handleCanPlay = useCallback(() => {
    setVideoLoaded(true);
    setVideoError(null);
  }, []);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newPlayCount = playCount + 1;
    setPlayCount(newPlayCount);
    watchStartTime.current = Date.now();

    // Start tracking on first play
    if (!hasStartedTracking) {
      setHasStartedTracking(true);
      console.log('▶️ Video started:', videoTitle)
      logAnalyticsEvent('video_watch_started', {
        play_count: newPlayCount,
        current_time: video.currentTime
      });
    } else {
      console.log('▶️ Video resumed:', videoTitle, 'at', Math.round(video.currentTime) + 's')
      logAnalyticsEvent('video_play', {
        play_count: newPlayCount,
        current_time: video.currentTime
      });
    }

    // Try to enter fullscreen
    if (video.requestFullscreen && newPlayCount === 1) {
      video.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  }, [playCount, hasStartedTracking, logAnalyticsEvent]);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newPauseCount = pauseCount + 1;
    setPauseCount(newPauseCount);

    // Calculate watched time for this session
    if (watchStartTime.current) {
      const sessionWatchTime = (Date.now() - watchStartTime.current) / 1000;
      totalWatchedTime.current += sessionWatchTime;
      watchStartTime.current = null;
    }

    console.log('⏸️ Video paused:', videoTitle, 'at', Math.round(video.currentTime) + 's')
    
    logAnalyticsEvent('video_pause', {
      pause_count: newPauseCount,
      current_time: video.currentTime,
      total_watched_seconds: totalWatchedTime.current,
      video_title: videoTitle,
      timestamp: new Date().toISOString()
    });
  }, [pauseCount, logAnalyticsEvent, videoTitle]);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const newSeekCount = seekCount + 1;
    setSeekCount(newSeekCount);

    // Check if this is a rewind (going backwards)
    const isRewind = video.currentTime < lastTimeRef.current;
    
    logAnalyticsEvent(isRewind ? 'video_rewind' : 'video_fast_forward', {
      seek_count: newSeekCount,
      from_time: lastTimeRef.current,
      to_time: video.currentTime,
      is_rewind: isRewind,
      video_title: videoTitle,
      timestamp: new Date().toISOString()
    });

    lastTimeRef.current = video.currentTime;
  }, [seekCount, logAnalyticsEvent, videoTitle]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    lastTimeRef.current = video.currentTime;

    // Track progress milestones (25%, 50%, 75%, 90%)
    const progress = (video.currentTime / video.duration) * 100;
    const milestones = [25, 50, 75, 90];
    
    milestones.forEach(milestone => {
      const storageKey = `video_milestone_${milestone}_${videoTitle}_${sessionId}`;
      if (progress >= milestone && !localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, 'true');
        logAnalyticsEvent('video_progress_milestone', {
          milestone_percent: milestone,
          current_time: video.currentTime,
          total_watched_seconds: totalWatchedTime.current
        });
      }
    });
  }, [logAnalyticsEvent, videoTitle, sessionId]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Final watched time calculation
    if (watchStartTime.current) {
      const sessionWatchTime = (Date.now() - watchStartTime.current) / 1000;
      totalWatchedTime.current += sessionWatchTime;
    }

    console.log('✅ Video completed:', {
      video: videoTitle,
      totalWatched: Math.round(totalWatchedTime.current) + 's',
      duration: Math.round(video.duration) + 's',
      playCount: playCount,
      pauseCount: pauseCount,
      efficiency: Math.round((totalWatchedTime.current / video.duration) * 100) + '%'
    })

    // Log completion with detailed analytics
    logAnalyticsEvent('video_watch_completed', {
      completion_percentage: 100,
      total_duration: video.duration,
      total_watched_seconds: totalWatchedTime.current,
      play_count: playCount,
      pause_count: pauseCount,
      seek_count: seekCount,
      watch_efficiency: (totalWatchedTime.current / video.duration) * 100
    });

    // Call the original onComplete callback
    onComplete();
  }, [onComplete, logAnalyticsEvent, playCount, pauseCount, seekCount]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Add all event listeners
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('seeked', handleSeeked);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        // Clean up event listeners
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('seeked', handleSeeked);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleLoadedMetadata, handleCanPlay, handleError, handlePlay, handlePause, handleSeeked, handleTimeUpdate, handleEnded]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        preload="metadata"
      />
      
      {/* Loading indicator */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading video...</p>
            <p className="text-xs text-gray-400 mt-1">{videoTitle}</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80">
          <div className="text-white text-center p-4">
            <div className="text-red-400 text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold mb-2">Video Error</h3>
            <p className="text-sm mb-3">{videoError}</p>
            <p className="text-xs text-gray-300">Video: {videoTitle}</p>
            <p className="text-xs text-gray-400">Path: {src}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {/* Optional: Show analytics debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded">
          <div>Loaded: {videoLoaded ? 'Yes' : 'No'}</div>
          <div>Error: {videoError ? 'Yes' : 'No'}</div>
          <div>Plays: {playCount}</div>
          <div>Pauses: {pauseCount}</div>
          <div>Seeks: {seekCount}</div>
          <div>Watched: {Math.round(totalWatchedTime.current)}s</div>
        </div>
      )}
    </div>
  );
} 
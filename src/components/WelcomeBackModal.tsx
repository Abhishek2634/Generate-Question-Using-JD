'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Typography } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { resetCurrentSession, resumeSession } from '@/lib/redux/interviewSlice';

const { Text } = Typography;

export default function WelcomeBackModal() {
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state: RootState) => state.interview);
  const [isVisible, setIsVisible] = useState(false);
  const hasShownModal = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Only show modal on page refresh/reload, not on fresh interview starts
    const checkForPageRefresh = () => {
      // Check if this is a page refresh vs a fresh load
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isPageRefresh = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
      
      // Also check if there's persistent session data from before
      const hasExistingSession = currentSession?.status === 'in-progress' && 
                                currentSession.questions && 
                                currentSession.questions.length > 0;

      // Only show modal if:
      // 1. Page was refreshed OR user returned to the page (not initial app start)
      // 2. There's an active session
      // 3. Modal hasn't been shown yet in this session
      if ((isPageRefresh || !isInitialMount.current) && 
          hasExistingSession && 
          !hasShownModal.current) {
        
        // Small delay to ensure Redux has rehydrated properly
        setTimeout(() => {
          setIsVisible(true);
          hasShownModal.current = true;
        }, 500);
      }
      
      isInitialMount.current = false;
    };

    // Only check after Redux has potentially rehydrated from persistence
    const timer = setTimeout(checkForPageRefresh, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once on mount

  // Reset the modal visibility when session changes to a new interview
  useEffect(() => {
    if (currentSession?.status === 'in-progress' && isInitialMount.current === false) {
      // If this is a completely new session (new candidateId), reset modal state
      const sessionAge = currentSession.candidateId ? 
        Date.now() - parseInt(currentSession.candidateId.split('_')[1]) : 0;
      
      // If session is less than 5 seconds old, it's probably a fresh start
      if (sessionAge < 5000) {
        hasShownModal.current = false;
        setIsVisible(false);
      }
    }
  }, [currentSession?.candidateId]);

  const handleResume = () => {
    dispatch(resumeSession());
    setIsVisible(false);
  };

  const handleStartNew = () => {
    dispatch(resetCurrentSession());
    setIsVisible(false);
    hasShownModal.current = false;
  };

  // Don't show modal if there's no active session
  if (!currentSession?.status || currentSession.status !== 'in-progress') {
    return null;
  }

  return (
    <Modal
      title="🎯 Welcome Back to Your Interview!"
      open={isVisible}
      closable={false}
      centered
      footer={[
        <Button key="new" onClick={handleStartNew} size="large">
          Start Fresh Interview
        </Button>,
        <Button key="resume" type="primary" onClick={handleResume} size="large">
          Resume Current Session
        </Button>,
      ]}
      width={500}
    >
      <div style={{ padding: '20px 0' }}>
        <Text>
          You have an unfinished interview session with <strong>{currentSession.questions?.length || 0}</strong> questions.
        </Text>
        <br /><br />
        <Text type="secondary">
          Current progress: Question <strong>{currentSession.currentQuestionIndex + 1}</strong> of <strong>{currentSession.questions?.length || 0}</strong>
        </Text>
        <br /><br />
        <Text>
          Would you like to resume where you left off or start a completely new interview?
        </Text>
      </div>
    </Modal>
  );
}

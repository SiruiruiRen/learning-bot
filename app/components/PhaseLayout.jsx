import React, { useEffect, useState, useRef } from 'react';
import { notifyPhaseTransition } from '../../lib/useChatAgent';
import { Bot, User, Send, LightbulbIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

// Create a client-side only ChatPortal component
const ChatPortal = dynamic(() => Promise.resolve(({ children, container }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  return mounted && container ? createPortal(children, container) : null;
}), { ssr: false });

// Loading tips component that shows different tips based on the current phase
const LoadingTips = ({ phase }) => {
  // Predefined tips for different phases
  const phaseTips = {
    phase1: [
      "Self-regulated learning helps you become an independent and efficient learner.",
      "Breaking down your goals into smaller, achievable tasks can make learning more manageable.",
      "Regular reflection on your learning process helps improve future learning experiences."
    ],
    phase2: [
      "Task Analysis helps you break down complex tasks into manageable steps.",
      "When planning resources, consider what materials, time, and support you'll need.",
      "SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.",
      "Planning ahead helps you identify potential obstacles before they arise."
    ],
    phase3: [
      "Monitoring your progress regularly helps you stay on track with your learning goals.",
      "If something isn't working, don't be afraid to adjust your strategy.",
      "Self-testing is one of the most effective ways to solidify your learning.",
      "Taking brief notes about what worked and what didn't can improve your future learning."
    ],
    phase4: [
      "A SMART goal should be Specific, Measurable, Achievable, Relevant, and Time-bound.",
      "Short-term goals help you build momentum toward your long-term objectives.",
      "Consider how your learning goals connect to your broader personal or career aspirations.",
      "Breaking down big goals into smaller milestones makes them less overwhelming."
    ],
    phase5: [
      "Reflecting on past learning experiences helps you improve future ones.",
      "Consider both what you learned and how you learned it.",
      "Identifying specific strategies that worked well helps reinforce good learning habits.",
      "Learning from setbacks is just as important as celebrating successes."
    ]
  };

  // Get tips for the current phase, defaulting to general tips if phase not found
  const currentPhaseTips = phaseTips[phase] || [
    "Setting SMART goals helps make your objectives clear and achievable.",
    "Breaking down complex tasks makes them more manageable.",
    "Regular reflection improves your learning process over time."
  ];

  // Select a random tip from the current phase
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prevIndex => (prevIndex + 1) % currentPhaseTips.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [currentPhaseTips.length]);

  return (
    <div className="loading-tip">
      <div className="tip-icon">
        <LightbulbIcon size={20} />
      </div>
      <div className="tip-content">
        <div className="tip-label">Tip:</div>
        <div className="tip-text">{currentPhaseTips[tipIndex]}</div>
      </div>
      <style jsx>{`
        .loading-tip {
          background-color: rgba(59, 130, 246, 0.1);
          border-left: 3px solid #3b82f6;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          border-radius: 0.25rem;
          display: flex;
          align-items: flex-start;
          max-width: 90%;
          transition: opacity 0.5s ease;
          animation: fadeInOut 12s infinite;
        }
        .tip-icon {
          color: #3b82f6;
          margin-right: 0.75rem;
          margin-top: 0.125rem;
        }
        .tip-content {
          flex: 1;
        }
        .tip-label {
          font-weight: 500;
          color: #3b82f6;
          margin-bottom: 0.25rem;
        }
        .tip-text {
          color: white;
          font-size: 0.925rem;
          line-height: 1.5;
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const PhaseLayout = ({ 
  children, 
  phase,
  component = "welcome",
  userId = null,
  title = null
}) => {
  const [introMessage, setIntroMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [agentType, setAgentType] = useState(null);
  const [phaseData, setPhaseData] = useState({
    phase: phase,
    component: component
  });
  const [chatPortalContainer, setChatPortalContainer] = useState(null);

  // Get userId from local storage if not provided
  useEffect(() => {
    const initUser = () => {
      let storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        // Generate a random user ID if none exists
        storedUserId = `user-${uuidv4()}`;
        localStorage.setItem('userId', storedUserId);
      }
      setCurrentUserId(storedUserId);
      
      // Create a conversation ID for this phase
      const convoId = `${storedUserId}-${phase}-${Date.now()}`;
      setConversationId(convoId);
    };
    
    initUser();
  }, [userId, phase]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Notify the backend of phase transition when the component mounts
  useEffect(() => {
    const fetchIntroduction = async () => {
      setIsLoading(true);
      try {
        if (currentUserId && phase) {
          console.log(`Fetching introduction for phase: ${phase}, component: ${component}`);
          const response = await notifyPhaseTransition(currentUserId, phase, component);
          
          // Handle different response formats
          let introMessage = "Welcome! I'll help guide you through this phase.";
          
          if (response) {
            if (response.data && response.data.message) {
              // New format with data wrapper
              introMessage = response.data.message;
              setAgentType(response.data.agent_type || phase);
            } else if (response.message) {
              // Direct format or fallback
              introMessage = response.message;
              setAgentType(response.agent_type || phase);
            }
          }
          
          setIntroMessage(introMessage);
          
          // Add the introduction message to the chat
          setMessages([{
            id: Date.now(),
            sender: 'bot',
            content: introMessage,
            timestamp: new Date(),
            isIntroduction: true
          }]);
        }
      } catch (error) {
        console.error('Error fetching phase introduction:', error);
        // Add a graceful fallback message in case of error
        setMessages([{
          id: Date.now(),
          sender: 'bot',
          content: `Welcome to ${phase}! I'm here to help you with your learning journey.`,
          timestamp: new Date(),
          isIntroduction: true
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchIntroduction();
    }
  }, [phase, component, currentUserId]);

  // Find chat portal container after mounting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const container = document.querySelector(".chat-container");
      if (container) {
        setChatPortalContainer(container);
      }
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field
    const messageSent = userInput;
    setUserInput('');
    
    // Add typing indicator
    setIsTyping(true);
    const typingIndicatorId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: typingIndicatorId,
      sender: 'bot',
      content: 'typing...',
      isTyping: true,
      timestamp: new Date()
    }]);
    
    try {
      // Send message to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          phase: phaseData.phase,
          component: phaseData.component,
          message: messageSent,
          conversationId: conversationId
        }),
      });
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));
      setIsTyping(false);
      
      if (!response.ok) {
        throw new Error(`Failed to get response (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      console.log('Received agent response:', data);
      
      // Normalize the response format to handle both wrapped and unwrapped responses
      const responseData = data.data ? data.data : data;
      
      if (!responseData || !responseData.message) {
        console.error('Invalid response format:', responseData);
        throw new Error('Invalid response format from agent');
      }
      
      // Add bot response
      const botMessage = {
        id: Date.now() + 2,
        sender: 'bot',
        content: responseData.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update agent type and phase data if available
      if (responseData.agent_type) {
        setAgentType(responseData.agent_type);
      }
      
      if (responseData.phase || responseData.component || responseData.next_component) {
        setPhaseData({
          phase: responseData.next_phase || responseData.phase || phaseData.phase,
          component: responseData.next_component || responseData.component || phaseData.component
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add an error message
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'bot',
        content: "I'm having trouble connecting to my systems. Please try again in a moment.",
        isError: true,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="phase-container">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading phase content...</p>
          <LoadingTips phase={phase} />
        </div>
      ) : (
        <div className="phase-layout">
          {title && (
            <div className="phase-title">
              <h1>{title}</h1>
            </div>
          )}
          
          <div className="main-content">
            {children}
          </div>
          
          {/* Only create portal when chatPortalContainer is available */}
          {chatPortalContainer && agentType && (
            <ChatPortal container={chatPortalContainer}>
              <div className="chat-section">
                <div className="chat-messages" id="chat-container" ref={chatContainerRef}>
                  {messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'} ${message.isTyping ? 'typing-indicator' : ''} ${message.isIntroduction ? 'introduction-message' : ''} ${message.isError ? 'error-message' : ''}`}
                    >
                      <div className="message-avatar">
                        {message.sender === 'bot' ? 
                          <Bot className="avatar-icon bot-icon" /> : 
                          <User className="avatar-icon user-icon" />
                        }
                      </div>
                      <div className="message-content">
                        {message.isTyping ? (
                          <div className="typing-dots">
                            <span></span><span></span><span></span>
                          </div>
                        ) : (
                          <>
                            {typeof message.content === 'string' && message.content.includes("message':") ? 
                              message.content.match(/message['"]?\s*:\s*['"]([^'"]+)['"]/)?.[1] || message.content : 
                              message.content}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && <LoadingTips phase={phase} />}
                </div>
                
                <div className="chat-input-container">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="chat-input"
                    disabled={isTyping}
                  />
                  <button 
                    onClick={handleSendMessage} 
                    className="send-button"
                    disabled={isTyping || !userInput.trim()}
                  >
                    <Send className="send-icon" />
                  </button>
                </div>
              </div>
            </ChatPortal>
          )}
        </div>
      )}

      <style jsx>{`
        .phase-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: white;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        .phase-layout {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .phase-title {
          padding: 1rem;
          background-color: #1e293b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .phase-title h1 {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
        }
        
        .main-content {
          flex: 1;
          overflow: visible;
        }
        
        .chat-section {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          scroll-behavior: smooth;
          max-height: calc(100vh - 15rem);
        }
        
        .message {
          display: flex;
          max-width: 85%;
          animation: fadeIn 0.3s ease-out;
        }
        
        .bot-message {
          align-self: flex-start;
        }
        
        .user-message {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .introduction-message {
          max-width: 100%;
        }
        
        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .bot-message .message-avatar {
          background-color: #3b82f6;
          margin-right: 0.5rem;
        }
        
        .user-message .message-avatar {
          background-color: #6366f1;
          margin-left: 0.5rem;
        }
        
        .avatar-icon {
          width: 20px;
          height: 20px;
          color: white;
        }
        
        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-size: 0.925rem;
          line-height: 1.5;
        }
        
        .bot-message .message-content {
          background-color: #1e293b;
          color: white;
          border-top-left-radius: 0.25rem;
        }
        
        .user-message .message-content {
          background-color: #3b82f6;
          color: white;
          border-top-right-radius: 0.25rem;
        }
        
        .typing-indicator {
          opacity: 0.7;
        }
        
        .typing-dots {
          display: flex;
          align-items: center;
          height: 20px;
        }
        
        .typing-dots span {
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.2s infinite;
        }
        
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .chat-input-container {
          display: flex;
          padding: 0.75rem;
          background-color: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(4px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chat-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(30, 41, 59, 0.8);
          color: white;
          resize: none;
          outline: none;
          font-size: 0.925rem;
          height: 3rem;
          min-height: 3rem;
          transition: border-color 0.15s ease;
        }
        
        .chat-input:focus {
          border-color: #3b82f6;
        }
        
        .send-button {
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          background-color: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 0.5rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
          border: none;
        }
        
        .send-button:hover {
          background-color: #2563eb;
        }
        
        .send-button:disabled {
          background-color: #1e293b;
          cursor: not-allowed;
        }
        
        .send-icon {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        
        .agent-info {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: #111827;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .agent-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #3b82f6;
          margin-right: 0.5rem;
        }
        
        .agent-name {
          font-size: 0.85rem;
          color: #a1a1aa;
          text-transform: capitalize;
        }
        
        .message-metadata {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 0.25rem;
          text-transform: capitalize;
        }
        
        .error-message .message-content {
          background-color: #991b1b !important;
        }
      `}</style>
    </div>
  );
};

export default PhaseLayout; 
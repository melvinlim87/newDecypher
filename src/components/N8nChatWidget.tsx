import React, { useEffect } from 'react';
import { auth } from '../lib/firebase';
import '@n8n/chat/style.css';
import '../styles/n8n-chat-custom.css'; // Custom CSS variables for n8n chat
import { createChat } from '@n8n/chat';

// Define Vue feature flags to prevent warnings
// This needs to be before any Vue code runs
if (typeof window !== 'undefined') {
  window.__VUE_OPTIONS_API__ = true;
  window.__VUE_PROD_DEVTOOLS__ = false;
  window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
}

// Global singleton to track chat instance
const globalState = {
  chatInitialized: false,
  containerId: 'n8n-global-chat-container',
  containerCreated: false
};

export function N8nChatWidget() {
  useEffect(() => {
    // Only create the container and initialize chat once across all component instances
    if (!globalState.containerCreated && auth.currentUser) {
      // Create the container only once
      const existingContainer = document.getElementById(globalState.containerId);
      if (!existingContainer) {
        const container = document.createElement('div');
        container.id = globalState.containerId;
        document.body.appendChild(container);
        globalState.containerCreated = true;
      }

      // Initialize chat only once
      if (!globalState.chatInitialized) {
        createChat({
          container: `#${globalState.containerId}`,
          webhookUrl: 'https://aibusinesssg2024.app.n8n.cloud/webhook/da1baff3-7d81-4bf3-90c3-b6be96c72f33/chat',
          initialMessages: [
            'Hi there! 👋 I am LazetradeBot. How can I assist you today?'
          ],i18n: {
            en: {
              title: 'Chat Support',
              subtitle: "Start a chat. We're here to help you 24/7.",
              footer: '',
              getStarted: 'New Conversation',
              inputPlaceholder: 'Type your question..',
            },
          },
          auth: {
            token: auth.currentUser.uid,
            userId: auth.currentUser.uid,
            email: auth.currentUser.email || undefined,
            name: auth.currentUser.displayName || undefined,
          },
          theme: {
            chatButton: {
              backgroundColor: '#6366f1',
              color: '#ffffff',
            },
            header: {
              backgroundColor: '#1e1e2d',
              title: 'Chat Support',
              titleColor: '#ffffff',
            },
            messageInput: {
              backgroundColor: '#1e1e2d',
              textColor: '#ffffff',
              sendButtonColor: '#6366f1',
              placeholderColor: '#9ca3af',
            },
            userMessage: {
              backgroundColor: '#6366f1',
              textColor: '#ffffff',
            },
            botMessage: {
              backgroundColor: '#1a1b2e',
              textColor: '#ffffff',
            },
            poweredBy: {
              textColor: '#9ca3af',
              backgroundColor: '#1e1e2d',
            },
          },
        });
        
        globalState.chatInitialized = true;
      }
    }
    
    // No cleanup - we want the chat to persist across the app lifecycle
  }, []);

  return null; // The n8n chat package injects the chat UI directly into the DOM
}
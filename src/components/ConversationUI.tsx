import React, { useState, useEffect, useRef } from 'react';
import { NPCData } from '../types/MapTypes';
import { ConversationMessage, ConversationSystem } from '../services/ConversationSystem';
import { MessageCircle, Send, X, User, Bot } from 'lucide-react';

interface ConversationUIProps {
  npc: NPCData;
  onClose: () => void;
  conversationSystem: ConversationSystem;
}

export const ConversationUI: React.FC<ConversationUIProps> = ({
  npc,
  onClose,
  conversationSystem
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [responseOptions, setResponseOptions] = useState<string[]>([]);
  const [customResponse, setCustomResponse] = useState('');
  const [isNPCTyping, setIsNPCTyping] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startConversation = async () => {
    setIsNPCTyping(true);
    try {
      const greeting = await conversationSystem.startConversation(npc);
      const npcMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        speaker: 'npc',
        content: greeting,
        timestamp: Date.now()
      };
      setMessages([npcMessage]);
      generateResponseOptions([npcMessage], greeting);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsNPCTyping(false);
    }
  };

  const generateResponseOptions = async (currentMessages: ConversationMessage[], npcMessage: string) => {
    setIsLoadingOptions(true);
    try {
      const options = await conversationSystem.generateResponseOptions(npc, currentMessages, npcMessage);
      setResponseOptions(options);
    } catch (error) {
      console.error('Failed to generate response options:', error);
      setResponseOptions(['That\'s interesting.', 'Tell me more.', 'I should go now.']);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add player message
    const playerMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      speaker: 'player',
      content: message,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, playerMessage];
    setMessages(updatedMessages);
    setCustomResponse('');
    setResponseOptions([]);
    setIsNPCTyping(true);

    try {
      // Generate NPC response
      const npcResponseContent = await conversationSystem.generateNPCResponse(npc, updatedMessages, message);
      const npcMessage: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        speaker: 'npc',
        content: npcResponseContent,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, npcMessage];
      setMessages(finalMessages);
      
      // Generate new response options
      generateResponseOptions(finalMessages, npcResponseContent);
    } catch (error) {
      console.error('Failed to get NPC response:', error);
    } finally {
      setIsNPCTyping(false);
    }
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(customResponse);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{npc.name}</h2>
              <p className="text-sm opacity-90">{npc.occupation || 'Local Resident'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.speaker === 'player' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.speaker === 'player' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.speaker === 'player'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {message.speaker === 'player' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.speaker === 'player'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isNPCTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Response Options */}
        {!isNPCTyping && (
          <div className="border-t bg-gray-50 p-4 space-y-3">
            {isLoadingOptions ? (
              <div className="text-center text-gray-500 text-sm">
                Generating response options...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Quick Responses:</p>
                  {responseOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleOptionClick(option)}
                      className="w-full text-left p-2 bg-white border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={customResponse}
                      onChange={(e) => setCustomResponse(e.target.value)}
                      placeholder="Type your own response..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!customResponse.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
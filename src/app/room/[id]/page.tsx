'use client';

import React, {useState, useEffect, useRef, use} from 'react';
import Link from 'next/link';
import { useUserContext } from '@/contexts/UserContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Message, sendMessage, subscribeToRoomMessages, joinRoom } from '@/lib/db';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { userName, isRoomAuthenticated, addAuthenticatedRoom, refreshUserSession, setUserName } = useUserContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionUserName, setSessionUserName] = useState(userName);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update sessionUserName whenever userName changes
  useEffect(() => {
    setSessionUserName(userName);
  }, [userName]);
  // Handle both Promise and plain object cases for params
  const { id } = params instanceof Promise ? use(params) : params;

  // State for password authentication
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if user is authenticated for this room and update sessionUserName
  useEffect(() => {
    const checkAuthentication = async () => {
      // Refresh the user session to get the updated userName
      const updatedUserName = await refreshUserSession();
      // Update the sessionUserName state variable with the latest userName
      setSessionUserName(updatedUserName);

      if (id && !isRoomAuthenticated(id)) {
        setShowPasswordPrompt(true);
      } else {
        // User is already authenticated for this room, ensure we have the latest userName
        setShowPasswordPrompt(false);
      }
    };

    checkAuthentication();
  }, [id, isRoomAuthenticated, refreshUserSession]);

  // Handle room authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) return;

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Use the name input if provided, otherwise use the existing userName
      const nameToUse = nameInput.trim() || userName;
      const result = await joinRoom(id, password, nameToUse);

      // Update the userName in the UserContext
      if (result.userName) {
        setUserName(result.userName);
        // Update the sessionUserName state variable with the returned userName
        setSessionUserName(result.userName);
      } else {
        // Refresh the user session to get the updated userName as a fallback
        await refreshUserSession();
        // Update the sessionUserName state variable with the latest userName
        setSessionUserName(userName);
      }

      addAuthenticatedRoom(id);
      setShowPasswordPrompt(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate. Please check your password.';
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set up a real-time listener for messages only if authenticated
    let unsubscribe = () => {};

    if (id && !showPasswordPrompt) {
      unsubscribe = subscribeToRoomMessages(id, (newMessages) => {
        setMessages(newMessages);
      });
    }

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [id, showPasswordPrompt]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
      // Refresh the user session to get the updated userName before sending the message
      const updatedUserName = await refreshUserSession();
      // Update the sessionUserName state variable with the latest userName
      setSessionUserName(updatedUserName);

      // Don't pass userName, let the API use the session userName
      await sendMessage(id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-500 mr-4">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Chat Room</h1>
          </div>
          <div>
            <span className="text-gray-700">
              {sessionUserName || 'Anonymous'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col">
        {showPasswordPrompt ? (
          <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Enter Room Password</h2>
            <p className="text-gray-600 mb-6">
              This room is password protected. Please enter the password to access the chat.
            </p>

            {authError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleAuthenticate}>
              <div className="mb-4">
                <Input
                  label="Your Name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name (optional)"
                />
              </div>
              <div className="mb-4">
                <Input
                  label="Room Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                isLoading={isAuthenticating}
                disabled={!password.trim()}
              >
                Join Room
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 bg-white shadow rounded-lg overflow-hidden flex flex-col">
            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.userName === sessionUserName ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                          message.userName === sessionUserName 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {message.userName !== sessionUserName && (
                          <div className="font-semibold text-xs mb-1">
                            {message.userName}
                          </div>
                        )}
                        <p>{message.text}</p>
                        <div className="text-xs mt-1 opacity-70">
                          {message.createdAt ? message.createdAt.toLocaleTimeString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 text-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  isLoading={isSending}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

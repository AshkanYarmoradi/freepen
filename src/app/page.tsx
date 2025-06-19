'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Home() {
  const { userName, setUserName } = useUserContext();
  const router = useRouter();
  const [nameInput, setNameInput] = useState(userName);

  const handleCreateRoom = () => {
    setUserName(nameInput);
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    setUserName(nameInput);
    router.push('/join-room');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">freepen Chat</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome to Freepen Chat</h2>

              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <Input
                    label="Your Display Name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button onClick={handleCreateRoom} className="w-full sm:w-auto">
                    Create a Room
                  </Button>
                  <Button variant="secondary" onClick={handleJoinRoom} className="w-full sm:w-auto">
                    Join a Room
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

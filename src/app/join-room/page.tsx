'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUserContext } from '@/contexts/UserContext';
import { joinRoom } from '@/lib/db';

// Form validation schema
const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

export default function JoinRoomPage() {
  const { userName } = useUserContext();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomFormValues>({
    resolver: zodResolver(joinRoomSchema),
  });

  const onSubmit = async (data: JoinRoomFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await joinRoom(data.roomId, data.password, userName);
      router.push(`/room/${data.roomId}`);
    } catch (error: any) {
      setServerError(error.message || 'An error occurred while joining the room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Join a Chat Room</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the room ID and password to join an existing chat room
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            </div>
          </div>
        )}

        <form className="bg-white shadow-md rounded-lg p-6 mb-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Room ID"
              type="text"
              {...register('roomId')}
              error={errors.roomId?.message}
              placeholder="Enter the room ID"
            />

            <Input
              label="Room Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="********"
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Join Room
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

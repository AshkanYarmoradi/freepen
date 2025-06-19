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
import { createRoom } from '@/lib/db';

// Form validation schema
const roomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RoomFormValues = z.infer<typeof roomSchema>;

export default function CreateRoomPage() {
  const router = useRouter();
  const { addAuthenticatedRoom } = useUserContext();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
  });

  const onSubmit = async (data: RoomFormValues) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const roomId = await createRoom(data.name, data.password);
      // Add the room to authenticated rooms list
      addAuthenticatedRoom(roomId);
      router.push(`/room/${roomId}`);
    } catch (error: unknown) {
      setServerError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while creating the room'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Create a New Chat Room</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a secure room where you can chat with others
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
              label="Room Name"
              type="text"
              {...register('name')}
              error={errors.name?.message}
              placeholder="My Chat Room"
            />

            <Input
              label="Room Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="********"
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="********"
            />
          </div>

          <div className="mt-6">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Create Room
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

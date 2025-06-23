import { db, storage } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  userName: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create a new user profile
 * @param userName The username for the profile
 * @param displayName Optional display name
 * @param bio Optional user bio
 * @returns Promise resolving to the created user profile
 * @throws Error if profile creation fails
 */
export const createUserProfile = async (
  userName: string,
  displayName?: string,
  bio?: string
): Promise<UserProfile> => {
  try {
    const userId = uuidv4();
    const userRef = doc(db, 'users', userId);

    const profileData: UserProfile = {
      id: userId,
      userName,
      displayName: displayName || userName,
      bio: bio || '',
      avatarUrl: '',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(userRef, profileData);

    return profileData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

/**
 * Get a user profile by ID
 * @param userId The ID of the user profile to retrieve
 * @returns Promise resolving to the user profile or null if not found
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

/**
 * Get a user profile by username
 * @param userName The username to search for
 * @returns Promise resolving to the user profile or null if not found
 */
export const getUserProfileByUserName = async (userName: string): Promise<UserProfile | null> => {
  try {
    // In a production app, you would use a query with where clause
    // For simplicity in this implementation, we're using a direct path
    // assuming usernames are unique and used as document IDs
    const userRef = doc(db, 'usernames', userName);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().userId) {
      return getUserProfile(userSnap.data().userId);
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile by username:', error);
    throw new Error('Failed to get user profile by username');
  }
};

/**
 * Update a user profile
 * @param userId The ID of the user profile to update
 * @param updates The profile fields to update
 * @returns Promise resolving to the updated user profile
 * @throws Error if profile update fails
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Add updatedAt timestamp
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);

    // Get the updated profile
    const updatedProfile = await getUserProfile(userId);
    if (!updatedProfile) {
      throw new Error('User profile not found after update');
    }

    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Upload a user avatar
 * @param userId The ID of the user
 * @param file The avatar file to upload
 * @returns Promise resolving to the avatar URL
 * @throws Error if avatar upload fails
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    // Create a reference to the avatar file in Firebase Storage
    const avatarRef = ref(storage, `avatars/${userId}/${uuidv4()}`);

    // Upload the file
    await uploadBytes(avatarRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(avatarRef);

    // Update the user profile with the new avatar URL
    await updateUserProfile(userId, { avatarUrl: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

/**
 * Delete a user avatar
 * @param userId The ID of the user
 * @param avatarUrl The URL of the avatar to delete
 * @returns Promise that resolves when the avatar is deleted
 * @throws Error if avatar deletion fails
 */
export const deleteAvatar = async (userId: string, avatarUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const avatarRef = ref(storage, avatarUrl);

    // Delete the file
    await deleteObject(avatarRef);

    // Update the user profile to remove the avatar URL
    await updateUserProfile(userId, { avatarUrl: '' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw new Error('Failed to delete avatar');
  }
};

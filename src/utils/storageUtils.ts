import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadImage = async (
  file: File | Blob,
  userId: string,
  type: 'analysis' | 'market-analysis' | 'chart',
  metadata?: { contentType?: string }
): Promise<string> => {
  try {
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `${type}_${timestamp}`;
    const storageRef = ref(storage, `users/${userId}/${type}s/${filename}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error.code, error.message, error.customData);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const uploadBase64Image = async (
  base64String: string,
  userId: string,
  type: 'analysis' | 'market-analysis' | 'chart'
): Promise<string> => {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(base64String);
    const blob = await base64Response.blob();

    // Upload the blob
    return await uploadImage(blob, userId, type, {
      contentType: 'image/png'
    });
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    throw error;
  }
};

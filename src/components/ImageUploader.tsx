import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { auth, uploadChartImage } from '../lib/firebase';

interface ImageUploaderProps {
  onImageSelect: (url: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (isLoading) return;

      try {
        // First create a local URL for immediate preview
        const localUrl = URL.createObjectURL(file);
        
        // Upload to Firebase if user is authenticated
        const user = auth.currentUser;
        if (user) {
          console.log('🚀 Uploading image to Firebase...');
          try {
            const imageUrl = await uploadChartImage(user.uid, file);
            console.log('✅ Image uploaded successfully:', {
              url: imageUrl.substring(0, 50) + '...'
            });
            onImageSelect(imageUrl);
          } catch (error) {
            console.error('❌ Firebase upload failed:', error);
            // Fallback to local URL if upload fails
            onImageSelect(localUrl);
          }
        } else {
          console.log('ℹ️ User not authenticated, using local URL');
          onImageSelect(localUrl);
        }
      } catch (error) {
        console.error('Failed to handle file:', error);
      }
    },
    [onImageSelect, isLoading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload, isLoading]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (isLoading) return;

      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    },
    [handleFileUpload, isLoading]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading) return;

      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
        // Reset the input value to allow selecting the same file again
        e.target.value = '';
      }
    },
    [handleFileUpload, isLoading]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
      className="w-full"
    >
      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer glass-effect ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center justify-center space-x-3">
          <Upload className="w-6 h-6 text-indigo-300" />
          <p className="text-sm text-white">
            <span className="font-semibold text-white">Click to upload</span> <span className="text-white">or drag and drop</span>
            <span className="text-xs text-white ml-2">
              or paste from clipboard
            </span>
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isLoading}
        />
      </label>
    </div>
  );
}
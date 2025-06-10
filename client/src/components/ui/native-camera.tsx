import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';

interface NativeCameraProps {
  onImageCapture: (imageData: string) => Promise<void>;
  onError: (error: string) => void;
  title?: string;
  accept?: string;
}

export function NativeCamera({ 
  onImageCapture, 
  onError, 
  title = "Take Photo",
  accept = "image/*"
}: NativeCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large. Please use an image smaller than 10MB.');
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          if (result) {
            await onImageCapture(result);
          }
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Failed to process image');
        }
      };
      
      reader.onerror = () => {
        onError('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process image');
    }

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        onClick={triggerCamera}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Camera className="h-4 w-4 mr-2" />
        {title}
      </Button>
      
      <div className="text-center text-sm text-gray-500">
        This will open your device's camera app
      </div>
    </div>
  );
}
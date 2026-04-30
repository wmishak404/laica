import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Video, VideoOff } from 'lucide-react';

interface NativeCameraProps {
  onImageCapture: (imageData: string) => Promise<void>;
  onError: (error: string) => void;
  title?: string;
  captureLabel?: string;
  uploadLabel?: string;
  accept?: string;
}

export function NativeCamera({ 
  onImageCapture, 
  onError, 
  title = "Live camera",
  captureLabel = "Capture photo",
  uploadLabel = "Upload photo instead",
  accept = "image/*"
}: NativeCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'starting' | 'ready' | 'blocked' | 'unsupported'>('starting');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted) setCameraState('unsupported');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('ready');
      } catch (error) {
        console.error('Camera permission or startup failed:', error);
        if (isMounted) setCameraState('blocked');
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

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
            await onImageCapture(result.includes(',') ? result.split(',')[1] : result);
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

  const captureFrame = async () => {
    if (!videoRef.current) {
      onError('Camera preview is not ready yet.');
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1024;
    const height = video.videoHeight || 1024;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (!context) {
      onError('Camera capture is not available on this device.');
      return;
    }

    setIsCapturing(true);
    try {
      context.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      await onImageCapture(dataUrl.split(',')[1]);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="overflow-hidden rounded-lg border bg-sidebar text-sidebar-foreground">
        <div className="relative aspect-[4/5] w-full bg-sidebar">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${cameraState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          />

          {cameraState !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {cameraState === 'starting' ? (
                <>
                  <Video className="h-10 w-10 text-sidebar-foreground/70" />
                  <p className="text-sm text-sidebar-foreground/70">Starting camera...</p>
                </>
              ) : (
                <>
                  <VideoOff className="h-10 w-10 text-sidebar-foreground/70" />
                  <div>
                    <p className="font-semibold">Camera is blocked</p>
                    <p className="mt-1 text-sm text-sidebar-foreground/70">
                      You can still upload a photo from your library.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/70" />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {title}
          </div>
        </div>
      </div>

      <Button
        onClick={captureFrame}
        disabled={cameraState !== 'ready' || isCapturing}
        className="h-12 w-full"
      >
        <Camera className="mr-2 h-4 w-4" />
        {isCapturing ? 'Capturing...' : captureLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={triggerCamera}
        className="h-11 w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploadLabel}
      </Button>
    </div>
  );
}

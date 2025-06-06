import { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, FlipHorizontal, X } from 'lucide-react';

interface WebcamProps {
  onCapture: (imageData: string) => Promise<void>;
  onError: (error: string) => void;
  onClose?: () => void;
  title?: string;
}

export function Webcam({ onCapture, onError, onClose, title = "Camera" }: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      onError('Unable to access camera. Please check permissions.');
    }
  }, [facingMode, onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 with better quality
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      if (imageData === 'data:,') {
        throw new Error('Failed to capture image');
      }

      await onCapture(imageData);
    } catch (error) {
      console.error('Error capturing image:', error);
      onError(error instanceof Error ? error.message : 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, onError]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full rounded-lg bg-gray-100 dark:bg-gray-800"
          style={{ maxHeight: '400px' }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={switchCamera}
          disabled={isCapturing}
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Flip Camera
        </Button>
        
        <Button
          onClick={captureImage}
          disabled={isCapturing || !stream}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isCapturing ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Capturing...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Capture Image
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analyzeImage } from '@/lib/openai';
import { Camera, RefreshCw, AlertTriangle } from 'lucide-react';

interface WebcamProps {
  onAnalysis: (data: any) => void;
  isAnalyzing?: boolean;
}

export function Webcam({ onAnalysis, isAnalyzing = false }: WebcamProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCapturing) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isCapturing]);

  const startCamera = async () => {
    setError(null);
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in your browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionDenied(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera access was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Your camera is already in use by another application.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        track.stop();
      });
      
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(
          videoRef.current,
          0, 0,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        );
        
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        setIsCapturing(false);
        
        // Convert data URL to base64 string without prefix
        const base64Image = imageData.split(',')[1];
        processImage(base64Image);
      }
    }
  };

  const processImage = async (base64Image: string) => {
    try {
      const result = await analyzeImage(base64Image);
      onAnalysis(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setIsCapturing(true);
  };

  const toggleCamera = () => {
    setIsCapturing(prev => !prev);
    setCapturedImage(null);
  };

  return (
    <div className="w-full">
      <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-text p-3 text-white flex justify-between items-center">
          <span className="font-medium">Live Cooking View</span>
          {isCapturing && (
            <div>
              <span className="bg-red-500 h-2 w-2 rounded-full inline-block"></span>
              <span className="text-xs ml-1">Live</span>
            </div>
          )}
        </div>
        
        <div className="relative aspect-[4/3] bg-gray-100">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-center text-red-500 font-medium mb-1">{error}</p>
              
              {permissionDenied && (
                <div className="text-sm text-gray-600 mt-2 mb-4 max-w-xs">
                  <p className="font-medium text-center mb-1">To enable camera access:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Click the camera/lock icon in your browser's address bar</li>
                    <li>Select "Allow" for camera access</li>
                    <li>Click "Try Again" below</li>
                  </ol>
                </div>
              )}
              
              <Button 
                onClick={() => {
                  setError(null);
                  setIsCapturing(true);
                }}
                className="mt-3 bg-primary text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : isCapturing ? (
            <>
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button 
                  onClick={captureImage}
                  variant="default" 
                  className="bg-primary hover:bg-primary/90 text-white rounded-full"
                >
                  <Camera className="h-5 w-5 mr-1" />
                  Capture
                </Button>
              </div>
            </>
          ) : (
            <>
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 p-4">
                  <Camera className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-center">Enable camera to get live cooking guidance</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 flex justify-center">
          {!isCapturing && (
            <Button
              onClick={resetCamera}
              variant="outline"
              className="mr-2"
              disabled={isAnalyzing}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retake
            </Button>
          )}
          <Button 
            onClick={toggleCamera} 
            variant={isCapturing ? "destructive" : "default"}
            className={isCapturing ? "" : "bg-secondary hover:bg-secondary/90"}
            disabled={isAnalyzing}
          >
            {isCapturing ? "Stop Camera" : "Start Camera"}
          </Button>
        </div>
      </div>
    </div>
  );
}

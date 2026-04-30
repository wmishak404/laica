import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, Sparkles, Upload, Video, VideoOff } from 'lucide-react';

interface NativeCameraProps {
  onImageCapture: (imageData: string) => Promise<void>;
  onError: (error: string) => void;
  title?: string;
  captureLabel?: string;
  uploadLabel?: string;
  accept?: string;
  showUploadButton?: boolean;
  disabled?: boolean;
  cameraToggleLabel?: string;
  variant?: 'default' | 'setup';
}

export function NativeCamera({ 
  onImageCapture, 
  onError, 
  title = "Live camera",
  captureLabel = "Capture photo",
  uploadLabel = "Upload photo instead",
  accept = "image/*",
  showUploadButton = true,
  disabled = false,
  cameraToggleLabel = "Camera",
  variant = 'default'
}: NativeCameraProps) {
  const toggleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraState, setCameraState] = useState<'off' | 'starting' | 'ready' | 'blocked' | 'unsupported'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const isSetup = variant === 'setup';

  useEffect(() => {
    let isMounted = true;

    function stopCamera() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    if (!cameraEnabled) {
      stopCamera();
      setCameraState('off');
      return () => {
        isMounted = false;
      };
    }

    async function startCamera() {
      setCameraState('starting');

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
      stopCamera();
    };
  }, [cameraEnabled]);

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
    <div className={isSetup ? 'setup-camera-card space-y-4 p-3' : 'space-y-4'}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className={isSetup ? 'setup-camera-toggle flex items-center justify-between px-3 py-2.5' : 'flex items-center justify-between rounded-lg border bg-card px-4 py-3'}>
        <div>
          <Label htmlFor={toggleId} className={isSetup ? 'text-sm font-extrabold text-[hsl(var(--setup-ink))]' : 'text-sm font-semibold'}>
            {cameraToggleLabel}
          </Label>
          <p className={isSetup ? 'mt-0.5 text-xs font-bold text-[hsl(var(--setup-ink)/0.62)]' : 'mt-0.5 text-xs text-muted-foreground'}>
            {cameraEnabled ? 'Live preview is on' : 'Off until you turn it on'}
          </p>
        </div>
        <Switch
          id={toggleId}
          checked={cameraEnabled}
          onCheckedChange={setCameraEnabled}
          aria-label={`${cameraEnabled ? 'Turn off' : 'Turn on'} ${cameraToggleLabel.toLowerCase()}`}
          disabled={disabled}
        />
      </div>

      <div className={isSetup ? 'setup-viewfinder text-sidebar-foreground' : 'overflow-hidden rounded-xl border bg-sidebar text-sidebar-foreground shadow-sm'}>
        <div className="relative aspect-[4/5] w-full">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${cameraState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          />

          {cameraState !== 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {cameraState === 'off' ? (
                <>
                  <div className={isSetup ? 'relative flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-white/85 text-primary shadow-lg' : ''}>
                    <VideoOff className={isSetup ? 'h-10 w-10' : 'h-10 w-10 text-sidebar-foreground/70'} />
                    {isSetup && <Sparkles className="absolute right-4 top-4 h-4 w-4 text-[hsl(var(--setup-butter))]" />}
                  </div>
                  <div>
                    <p className="font-semibold">Camera is off</p>
                    <p className="mt-1 text-sm text-sidebar-foreground/70">
                      Turn it on when you want a live preview.
                    </p>
                  </div>
                </>
              ) : cameraState === 'starting' ? (
                <>
                  <div className={isSetup ? 'relative flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-white/85 text-primary shadow-lg' : ''}>
                    <Video className={isSetup ? 'h-10 w-10 animate-pulse' : 'h-10 w-10 text-sidebar-foreground/70'} />
                  </div>
                  <p className="text-sm text-sidebar-foreground/70">Starting camera...</p>
                </>
              ) : cameraState === 'unsupported' ? (
                <>
                  <div className={isSetup ? 'relative flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-white/85 text-primary shadow-lg' : ''}>
                    <VideoOff className={isSetup ? 'h-10 w-10' : 'h-10 w-10 text-sidebar-foreground/70'} />
                  </div>
                  <div>
                    <p className="font-semibold">Camera is not available</p>
                    <p className="mt-1 text-sm text-sidebar-foreground/70">
                      Upload a photo or enter items manually.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={isSetup ? 'relative flex h-24 w-24 items-center justify-center rounded-[1.4rem] bg-white/85 text-primary shadow-lg' : ''}>
                    <VideoOff className={isSetup ? 'h-10 w-10' : 'h-10 w-10 text-sidebar-foreground/70'} />
                  </div>
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

          {isSetup ? (
            <>
              <span className="setup-viewfinder-corner left-4 top-4 border-l-4 border-t-4" />
              <span className="setup-viewfinder-corner right-4 top-4 border-r-4 border-t-4" />
              <span className="setup-viewfinder-corner bottom-4 left-4 border-b-4 border-l-4" />
              <span className="setup-viewfinder-corner bottom-4 right-4 border-b-4 border-r-4" />
              {cameraState === 'ready' && <span className="setup-focus-ring pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2" />}
            </>
          ) : (
            <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/70" />
          )}
          <div className={isSetup ? 'setup-live-badge absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5' : 'absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs'}>
            <span className="h-2 w-2 rounded-full bg-primary" />
            {title}
          </div>
        </div>
      </div>

      <Button
        onClick={captureFrame}
        disabled={disabled || cameraState !== 'ready' || isCapturing}
        variant={isSetup ? 'ghost' : 'default'}
        className={isSetup ? 'setup-primary-button h-14 w-full text-base' : 'h-12 w-full'}
      >
        <Camera className="mr-2 h-4 w-4" />
        {isCapturing ? 'Capturing...' : captureLabel}
      </Button>

      {showUploadButton && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerCamera}
          className={isSetup ? 'setup-secondary-button h-12 w-full' : 'h-11 w-full'}
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadLabel}
        </Button>
      )}
    </div>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, CameraOff, CircleHelp, Sparkles, Upload, Video, VideoOff } from 'lucide-react';

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
  setupTone?: 'pantry' | 'kitchen';
  tipsTitle?: string;
  tipsDescription?: string;
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
  variant = 'default',
  setupTone = 'pantry',
  tipsTitle = 'Scanning tips',
  tipsDescription = 'Use good light and scan one area at a time.'
}: NativeCameraProps) {
  const toggleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onErrorRef = useRef(onError);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraState, setCameraState] = useState<'off' | 'starting' | 'ready' | 'blocked' | 'unsupported'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const isSetup = variant === 'setup';
  const setupToneClass = setupTone === 'kitchen' ? 'setup-camera-kitchen' : 'setup-camera-pantry';

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getCameraStartErrorMessage = (error: unknown) => {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        return 'Camera permission is blocked. Allow camera access in your browser settings, or upload a photo instead.';
      }

      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'No camera was found on this device. Upload a photo or enter items manually.';
      }

      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return 'The camera could not start. It may be in use by another app. Upload a photo or enter items manually.';
      }
    }

    return 'The camera could not start on this device. Upload a photo or enter items manually.';
  };

  const triggerCaptureFlash = () => {
    if (!isSetup) return;

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    setFlashVisible(false);
    const showFlash = () => {
      setFlashVisible(true);
      flashTimeoutRef.current = setTimeout(() => setFlashVisible(false), 260);
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(showFlash);
    } else {
      showFlash();
    }
  };

  useEffect(() => {
    let isMounted = true;

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
        if (isMounted) {
          setCameraState('unsupported');
          onErrorRef.current('Live camera is not available in this browser. Upload a photo or enter items manually.');
        }
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
        if (isMounted) {
          setCameraState('blocked');
          onErrorRef.current(getCameraStartErrorMessage(error));
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [cameraEnabled]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
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
      onError('Turn on the camera and wait for the live preview before capturing.');
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
      triggerCaptureFlash();
      await onImageCapture(dataUrl.split(',')[1]);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className={isSetup ? `setup-camera-card ${setupToneClass} space-y-3 p-3` : 'space-y-4'}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!isSetup && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <div>
            <Label htmlFor={toggleId} className="text-sm font-semibold">
              {cameraToggleLabel}
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
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
      )}

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
                    <p className="font-semibold">Camera could not start</p>
                    <p className="mt-1 text-sm text-sidebar-foreground/70">
                      Check permissions, or upload a photo instead.
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
          <div className={isSetup ? 'setup-live-badge absolute left-1/2 top-3 -translate-x-1/2 px-3 py-1.5' : 'absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs'}>
            <span className="h-2 w-2 rounded-full bg-primary" />
            {title}
          </div>
          {isSetup && flashVisible && <span className="setup-camera-flash" aria-hidden="true" />}

          {isSetup && tipsOpen && (
            <div className="setup-tips-panel absolute bottom-20 right-3 max-w-[13rem] p-3 text-left">
              <p className="text-sm font-extrabold">{tipsTitle}</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-white/78">{tipsDescription}</p>
            </div>
          )}

          {isSetup && (
            <div className="absolute bottom-5 left-0 right-0 flex items-center justify-between px-7">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="setup-camera-icon-button h-14 w-14"
                onClick={() => setCameraEnabled((enabled) => !enabled)}
                aria-label={`${cameraEnabled ? 'Turn off' : 'Turn on'} ${cameraToggleLabel.toLowerCase()}`}
                disabled={disabled}
              >
                {cameraEnabled ? <Camera className="h-8 w-8" /> : <CameraOff className="h-8 w-8" />}
              </Button>

              <Button
                type="button"
                onClick={captureFrame}
                disabled={disabled || cameraState !== 'ready' || isCapturing}
                variant="ghost"
                size="icon"
                className="setup-camera-round-button h-16 w-16"
                aria-label={captureLabel}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="setup-camera-icon-button h-14 w-14"
                onClick={() => setTipsOpen((open) => !open)}
                aria-expanded={tipsOpen}
                aria-label="Scanning tips"
              >
                <CircleHelp className="h-8 w-8" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isSetup && (
        <Button
          onClick={captureFrame}
          disabled={disabled || cameraState !== 'ready' || isCapturing}
          className="h-12 w-full"
        >
          <Camera className="mr-2 h-4 w-4" />
          {isCapturing ? 'Capturing...' : captureLabel}
        </Button>
      )}

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

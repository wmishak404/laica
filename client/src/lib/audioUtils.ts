// Audio utilities for cost optimization
export interface AudioProcessingResult {
  blob: Blob;
  duration: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export class AudioProcessor {
  private static readonly TARGET_SAMPLE_RATE = 16000; // 16kHz for optimal Whisper processing
  private static readonly TARGET_BIT_DEPTH = 16;
  private static readonly SILENCE_THRESHOLD = 0.01; // Threshold for silence detection
  private static readonly MIN_AUDIO_DURATION = 0.5; // 500ms minimum
  
  /**
   * Compress and optimize audio for transcription
   */
  static async compressAudio(audioBlob: Blob): Promise<AudioProcessingResult> {
    const audioContext = new AudioContext();
    
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Trim silence from beginning and end
      const trimmedBuffer = this.trimSilence(audioBuffer);
      
      // Resample to target sample rate if needed
      const resampledBuffer = await this.resampleAudio(audioContext, trimmedBuffer, this.TARGET_SAMPLE_RATE);
      
      // Convert to mono if stereo
      const monoBuffer = this.convertToMono(audioContext, resampledBuffer);
      
      // Convert back to blob with compression
      const compressedBlob = await this.audioBufferToCompressedBlob(monoBuffer);
      
      const compressionRatio = audioBlob.size / compressedBlob.size;
      
      return {
        blob: compressedBlob,
        duration: monoBuffer.duration,
        originalSize: audioBlob.size,
        compressedSize: compressedBlob.size,
        compressionRatio
      };
    } finally {
      audioContext.close();
    }
  }
  
  /**
   * Trim silence from the beginning and end of audio
   */
  private static trimSilence(audioBuffer: AudioBuffer): AudioBuffer {
    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length;
    
    // Find first non-silent sample
    let start = 0;
    for (let i = 0; i < length; i++) {
      if (Math.abs(channelData[i]) > this.SILENCE_THRESHOLD) {
        start = Math.max(0, i - 1000); // Keep 1000 samples (padding)
        break;
      }
    }
    
    // Find last non-silent sample
    let end = length;
    for (let i = length - 1; i >= 0; i--) {
      if (Math.abs(channelData[i]) > this.SILENCE_THRESHOLD) {
        end = Math.min(length, i + 1000); // Keep 1000 samples (padding)
        break;
      }
    }
    
    // If the audio is too short after trimming, return minimal version
    const trimmedLength = end - start;
    if (trimmedLength < audioBuffer.sampleRate * this.MIN_AUDIO_DURATION) {
      // Return original if trimming would make it too short
      return audioBuffer;
    }
    
    // Create new buffer with trimmed audio
    const trimmedBuffer = new AudioContext().createBuffer(
      audioBuffer.numberOfChannels,
      trimmedLength,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < trimmedLength; i++) {
        targetData[i] = sourceData[start + i];
      }
    }
    
    return trimmedBuffer;
  }
  
  /**
   * Resample audio to target sample rate
   */
  private static async resampleAudio(
    audioContext: AudioContext, 
    audioBuffer: AudioBuffer, 
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }
    
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    return await offlineContext.startRendering();
  }
  
  /**
   * Convert stereo to mono
   */
  private static convertToMono(audioContext: AudioContext, audioBuffer: AudioBuffer): AudioBuffer {
    if (audioBuffer.numberOfChannels === 1) {
      return audioBuffer;
    }
    
    const monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
    const monoData = monoBuffer.getChannelData(0);
    
    // Mix all channels to mono
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / audioBuffer.numberOfChannels;
    }
    
    return monoBuffer;
  }
  
  /**
   * Convert AudioBuffer to compressed blob
   */
  private static async audioBufferToCompressedBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    // Convert to 16-bit PCM WAV format for optimal compression
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    
    // Create WAV file
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 samples to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Validate if audio contains meaningful speech
   */
  static validateAudioQuality(audioBuffer: AudioBuffer): {
    isValid: boolean;
    reason?: string;
    confidence: number;
  } {
    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length;
    
    // Check duration
    if (audioBuffer.duration < this.MIN_AUDIO_DURATION) {
      return {
        isValid: false,
        reason: 'Audio too short (minimum 0.5 seconds)',
        confidence: 0
      };
    }
    
    // Check for silence
    let nonSilentSamples = 0;
    let maxVolume = 0;
    
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > this.SILENCE_THRESHOLD) {
        nonSilentSamples++;
      }
      maxVolume = Math.max(maxVolume, abs);
    }
    
    const speechRatio = nonSilentSamples / length;
    
    if (speechRatio < 0.1) {
      return {
        isValid: false,
        reason: 'Audio appears to be mostly silence',
        confidence: speechRatio
      };
    }
    
    if (maxVolume < 0.05) {
      return {
        isValid: false,
        reason: 'Audio volume too low',
        confidence: maxVolume * 20
      };
    }
    
    // Calculate confidence based on speech characteristics
    const confidence = Math.min(1, speechRatio * 2 + maxVolume * 2);
    
    return {
      isValid: true,
      confidence
    };
  }
}
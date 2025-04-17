import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream: MediaStream | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      videoElement.srcObject = this.stream;
      
      // Wait until video is actually playing
      return new Promise((resolve) => {
        videoElement.onplaying = () => {
          console.log('Video is now playing');
          resolve();
        };
      });
    } catch (err) {
      console.error('Camera error:', err);
      throw err;
    }
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  captureImage(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas error');
    
    // Check if video has enough data (value 4 means HAVE_ENOUGH_DATA)
    if (videoElement.readyState < 4) {
      throw new Error('Video not ready for capture');
    }
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }
}
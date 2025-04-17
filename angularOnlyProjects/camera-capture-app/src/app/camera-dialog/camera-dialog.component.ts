import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { cameraDialogAnimation } from './camera-dialog-animation';

@Component({
  selector: 'app-camera-dialog',
  standalone: true,
  imports: [],
  templateUrl: './camera-dialog.component.html',
  styleUrl: './camera-dialog.component.scss',
  animations: [cameraDialogAnimation]
})
export class CameraDialogComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private mediaStream: MediaStream | null = null;

  constructor(private dialogRef: MatDialogRef<CameraDialogComponent>) {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'environment' 
        }
      });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
    } catch (err) {
      console.error('Camera error:', err);
      this.dialogRef.close(null);
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  capture(): void {
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    if (!context || !this.videoElement.nativeElement) return;

    canvas.width = this.videoElement.nativeElement.videoWidth;
    canvas.height = this.videoElement.nativeElement.videoHeight;
    context.drawImage(this.videoElement.nativeElement, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    this.stopCamera();
    this.dialogRef.close(imageData);
  }

  cancel(): void {
    this.stopCamera();
    this.dialogRef.close(null);
  }
}
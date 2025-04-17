import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CameraComponent } from './camera/camera.component';
import { CommonModule } from '@angular/common';
import { CameraDialogComponent } from './camera-dialog/camera-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-root',
    imports: [
        CameraComponent,
        MatDialogModule,
        CommonModule // For common directives like ngIf, ngFor, ngClass
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'] // Note: styleUrls (plural) is the correct property
})
export class AppComponent {
  title = 'camera-capture-app';
}
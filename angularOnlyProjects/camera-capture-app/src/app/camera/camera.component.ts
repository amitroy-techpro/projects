import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CameraDialogComponent } from '../camera-dialog/camera-dialog.component';
import { Feature, LineString, GeoJsonProperties } from 'geojson';
import * as turf from '@turf/turf';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import pointToLineDistance from '@turf/point-to-line-distance';

interface CapturedImage {
  image: string;
  location: { lat: number; lng: number };
  address: string;
  timestamp: Date;
  chainage: number;
}

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.scss',
  providers: [DecimalPipe]
})
export class CameraComponent {
  capturedImages: CapturedImage[] = [];
  private route: Feature<LineString, GeoJsonProperties> | null = null;

  constructor(
    private dialog: MatDialog,
    private decimalPipe: DecimalPipe
  ) {}

  openCamera(): void {
    this.dialog.open(CameraDialogComponent, {
      width: '100%',
      maxWidth: '640px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'camera-dialog',
      disableClose: true,
      autoFocus: false
    }).afterClosed().subscribe((imageData: string | null) => {
      if (imageData) {
        this.addCapturedImage(imageData);
      }
    });
  }

  deleteImage(index: number): void {
    this.capturedImages.splice(index, 1);
  }

  formatCoordinate(value: number): string {
    return this.decimalPipe.transform(value, '1.4-4') ?? value.toString();
  }

  formatDate(date: Date): string {
    return date.toLocaleString();
  }

  formatChainage(value: number): string {
    return this.decimalPipe.transform(value / 1000, '1.3-3') + ' km';
  }

  private async addCapturedImage(imageData: string): Promise<void> {
    try {
      const position = await this.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      await this.fetchNearestRoad(lat, lng); // Dynamically fetch road
      const address = await this.getAddress(lat, lng);
      const chainage = this.calculateRoadChainage(lat, lng);
      // console.log(`Image captured - Lat: ${lat}, Lng: ${lng}, Chainage: ${chainage} meters`);
      this.capturedImages.unshift({
        image: imageData,
        location: { lat, lng },
        address,
        timestamp: new Date(),
        chainage
      });
    } catch (error) {
      console.error('Error capturing image:', error);
      this.capturedImages.unshift({
        image: imageData,
        location: { lat: 0, lng: 0 },
        address: 'Location unavailable',
        timestamp: new Date(),
        chainage: 0
      });
    }
  }

  private async fetchNearestRoad(lat: number, lng: number): Promise<void> {
    try {
      const overpassQuery = `
        [out:json];
        way["highway"](around:1000,${lat},${lng});
        out geom;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      if (!response.ok) throw new Error('Failed to fetch road data');
      const data = await response.json();
      if (!data.elements || data.elements.length === 0) throw new Error('No roads found nearby');

      const coordinates = data.elements[0].geometry.map((point: { lon: number; lat: number }) => [
        point.lon,
        point.lat
      ]);
      this.route = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates
        },
        properties: {}
      };
      // console.log('Fetched road route:', this.route);
    } catch (error) {
      console.error('Error fetching road:', error);
      this.route = null;
    }
  }

  private calculateRoadChainage(lat: number, lng: number): number {
    try {
      if (!this.route || !this.route.geometry.coordinates.length) {
        console.warn('No road route available. Chainage will be 0.');
        return 0;
      }

      const point = turf.point([lng, lat]);
      const nearest = nearestPointOnLine(this.route, point, { units: 'meters' as const });
      const snappedPoint = nearest.geometry.coordinates;
      const routeCoords = this.route.geometry.coordinates;
      let totalDistance = 0;

      for (let i = 1; i < routeCoords.length; i++) {
        const segmentStart = turf.point(routeCoords[i - 1]);
        const segmentEnd = turf.point(routeCoords[i]);
        const segmentLine = turf.lineString([routeCoords[i - 1], routeCoords[i]]);

        const segmentDistance = pointToLineDistance(point, segmentLine, { units: 'meters' as const });
        if (segmentDistance < 50) { // Within 50 meters of the road
          totalDistance += turf.distance(segmentStart, point, { units: 'meters' });
          console.log(`Point snapped to segment ${i}. Chainage: ${totalDistance} meters`);
          break;
        }

        totalDistance += turf.distance(segmentStart, segmentEnd, { units: 'meters' });
      }

      return totalDistance;
    } catch (error) {
      console.error('Error calculating chainage:', error);
      return 0;
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  }

  private async getAddress(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name ?? 'Unknown address';
    } catch {
      return 'Unknown address';
    }
  }
}
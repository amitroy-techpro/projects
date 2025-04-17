import { animate, AnimationTriggerMetadata, style, transition, trigger } from '@angular/animations';

export const cameraDialogAnimation: AnimationTriggerMetadata = trigger('dialogAnimation', [
  transition(':enter', [
    style({ transform: 'translateY(-100vh)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ transform: 'translateY(0)', opacity: 1 }),
    animate('300ms ease-in', style({ transform: 'translateY(100vh)', opacity: 0 }))
  ])
]);
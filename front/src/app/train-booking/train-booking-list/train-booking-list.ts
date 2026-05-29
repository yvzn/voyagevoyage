import { Component } from '@angular/core';
import { TrainBookingDashboardComponent } from '../train-booking-dashboard/train-booking-dashboard';

@Component({
  selector: 'app-train-booking-list',
  standalone: true,
  imports: [TrainBookingDashboardComponent],
  templateUrl: './train-booking-list.html',
})
export class TrainBookingListComponent {}

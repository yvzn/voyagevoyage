import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HotelBookingDashboardComponent } from '../hotel-booking-dashboard/hotel-booking-dashboard';

@Component({
  selector: 'app-hotel-booking-list',
  standalone: true,
  imports: [HotelBookingDashboardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './hotel-booking-list.html',
})
export class HotelBookingListComponent {}

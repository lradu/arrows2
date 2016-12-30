import { Component } from '@angular/core';
import { AngularFire } from 'angularfire2'
import { Router } from '@angular/router';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent {
	constructor(private af: AngularFire, private router: Router) {}

	logout() {
	  this.af.auth.logout();
	  this.router.navigate(['/'])
	}
}
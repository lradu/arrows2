import { Component, AfterViewInit, OnInit, Inject } from '@angular/core';
import { AngularFire } from 'angularfire2'
import { Router } from '@angular/router';

import { DiagramComponent } from './diagram/diagram.component';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html', 
})

export class DashboardComponent implements AfterViewInit {

	constructor(private af: AngularFire, private router: Router) {}

	logout() {
	  this.af.auth.logout();
	  this.router.navigate([""]);
	}

	ngAfterViewInit() {

	}
}
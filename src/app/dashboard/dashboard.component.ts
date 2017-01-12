import { Component, AfterViewInit, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2'
import { Router } from '@angular/router';

import { DiagramComponent } from './diagram/diagram.component';
import { Node } from './diagram/graph/node';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements AfterViewInit {
	public dbref: any;
	public user: any;

	public title: any;

	constructor(
		private af: AngularFire,
		@Inject(FirebaseApp) firebase: any,
		private router: Router,
		private ref: ChangeDetectorRef
		) {
		this.dbref = firebase.database().ref();
		this.user = firebase.auth().currentUser;
		this.dbref.child('users/' + this.user.uid + '/currentDiagram').once('value', 
			(snap) => { 
				this.dbref.child('diagrams/' + 'diagram1' + '/title').once('value',
					(snapShot) => { this.title = snapShot.val(); this.ref.detectChanges(); });
			});
		
	}

	logout() {
	  this.af.auth.logout();
	  this.router.navigate([""]);
	}

	ngAfterViewInit() {
	}

	newNode(){
		let node = new Node();
		let getId = this.dbref.child('diagrams/diagram1/data/nodes').push(node);
		getId.ref.update({
			"id": getId.key
		});
	}

	onEvent(event) {
	   event.stopPropagation();
	}
}
import { Component, Inject } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  selector: 'diagram',
  templateUrl: './diagram.component.html'
})

export class DiagramComponent { 
	public email: string;
	constructor(private af: AngularFire) {  }

	ngOnInit() {
	    this.af.auth.subscribe(auth => {
	      console.log(auth.auth.email);
	      this.email = auth.auth.email;
	    });
	}
}
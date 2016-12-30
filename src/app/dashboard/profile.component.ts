import { Component, Inject } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html'
})

export class ProfileComponent { 
    public email: string;
    constructor(private af: AngularFire) {  }

    ngOnInit() {
        this.af.auth.subscribe(auth => {
          console.log(auth.auth.email);
          this.email = auth.auth.email;
        });
    }

}

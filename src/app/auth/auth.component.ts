import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpModule } from '@angular/http';

import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  templateUrl: './signup.component.html'
})

export class SignupComponent {

  constructor(private af: AngularFire, private router: Router) {}

  onSubmit(formData) {
  	if(formData.valid) {
  		this.af.auth.createUser({
  			email: formData.value.email,
  			password: formData.value.password
  		}).then(
  			(success) => {
  				console.log(success);
  				this.router.navigate(['/dashboard']);
  		}).catch(
  			(error) => {
  				console.log(error);
  				alert(error);
  		})
  	}
  }
}

@Component({
  templateUrl: './login.component.html'
})

export class LoginComponent {

  constructor(private af: AngularFire, private router: Router) {}

  onSubmit(formData) {
  	if(formData.valid) {
  		this.af.auth.login({
  			email: formData.value.email,
  			password: formData.value.password
  		}).then(
  			(success) => {
  				console.log(success);
  				this.router.navigate(['/dashboard']);
  		}).catch(
  			(error) => {
  				console.log(error);
  				alert(error);
  		})
  	}
  }
}

@Component({
  templateUrl: './resetpassword.component.html'
})

export class ResetpassComponent {
  public auth: any;

  constructor(private af: AngularFire, @Inject(FirebaseApp) firebaseApp: any, private router: Router) {
    this.auth = firebaseApp.auth()
  }

  onSubmit(formData) {
     if(formData.valid) {
       this.auth.sendPasswordResetEmail(formData.value.email)
         .then( (response) => {
           console.log('Reset worked');
           this.router.navigate(['/login']);
         })
         .catch( (error) => {
           console.log(error);
           alert(error);
         })
     }
  }
}
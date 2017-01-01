import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpModule } from '@angular/http';

import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  templateUrl: './signup.component.html'
})

export class SignupComponent {
	public error: any;

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
  			(err) => {
  				console.log(err);
  				this.error = err.message;
  		})
  	}
  }
}

@Component({
  templateUrl: './login.component.html'
})

export class LoginComponent {
	public error: any;

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
  			(err) => {
  				console.log(err);
  				this.error = err.message;
  		})
  	}
  }
}

@Component({
  templateUrl: './resetpassword.component.html'
})

export class ResetpassComponent {
  public auth: any;
  public error: any;

  constructor(private af: AngularFire, @Inject(FirebaseApp) firebase: any, private router: Router) {
    this.auth = firebase.auth()
  }

  onSubmit(formData) {
  	//todo
  	// alert doesn't work well inside firebase calls
    if(formData.valid) {
      this.auth.sendPasswordResetEmail(formData.value.email)
      .then( 
      	(response) => {
        	console.log('Reset worked');
        	this.router.navigate(['/login']);
      }).catch( 
      	(err) => {
          console.log(err);
          this.error = err.message;
        })
    }
  }
}
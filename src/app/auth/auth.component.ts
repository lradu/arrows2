import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpModule } from '@angular/http';

import { AngularFire, FirebaseApp } from 'angularfire2';
import { Node } from '../dashboard/diagram/graph/node';

@Component({
  templateUrl: './signup.component.html'
})

export class SignupComponent {
	public error: any;
  public f: any;
  public date: string;

  constructor(
    private af: AngularFire,
    @Inject(FirebaseApp) firebase: any, 
    private router: Router) {
    this.f = firebase;
    this.date = new Date().toLocaleDateString();
  }

  onSubmit(formData) {
  	if(formData.valid) {
  		this.af.auth.createUser({
  			email: formData.value.email,
  			password: formData.value.password
  		}).then(
  			(success) => {
  				console.log(success);
          this.createUserData();
  		}).catch(
  			(err) => {
  				console.log(err);
  				this.error = err.message;
  		})
  	}
  }

  createUserData(){
    let node = new Node();
    let user = this.f.auth().currentUser;
    console.log(node, user.uid);
    this.f
      .database()
      .ref('diagrams/')
      .push({
      "data": {
        "nodes": {
          "0": node
        }
      },
      "info" : {
        "created" : this.date,
        "lastUpdate" : this.date,
        "title" : "My new diagram"
      },
      "users" : {
        [user.uid] : {
          "access" : "Owner",
          "dateAdded" : this.date,
          "email" : user.email,
          "lastUpdate" : this.date
        }
      }
    }).then(
      (newD) => {
        this.f
          .database()
          .ref('users/' + user.uid)
          .update({
            "currentDiagram": newD.key,
            "sortAccess": {
              "asc": true,
              "col": "title"
            },
            "diagrams": {
              [newD.key]: true
            }
        }).then(
          (s) => {
            this.router.navigate(['/dashboard']);
          }
        );
      }
    );
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

  constructor(private ref: ChangeDetectorRef, private af: AngularFire, @Inject(FirebaseApp) firebase: any, private router: Router) {
    this.auth = firebase.auth()
  }

  onSubmit(formData) {
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
          this.ref.detectChanges();
        })
    }
  }
}
import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpModule } from '@angular/http';

import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  templateUrl: './signup.component.html'
})

export class SignupComponent {
    private error: any;
    private date: string;
    private f: any;

    constructor(
        private af: AngularFire,
        @Inject(FirebaseApp) firebase: any, 
        private router: Router) {
        this.f = firebase;
    }

  onSubmit(formData) {
    if(formData.valid) {
        let dbref = this.f.database().ref();

        this.af.auth.createUser({
            email: formData.value.email,
            password: formData.value.password
        }).then(
            (success) => {
            let user = this.f.auth().currentUser;   
            dbref.child('users/' + user.uid)
                .update({
                    "email" :  user.email,
                    "sortAccess": {        
                        "asc": true,        
                        "col": "title"        
                    }
                }).then(() => {
                    this.router.navigate(['/dashboard']);
                });
        }).catch(
            (err) => {
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
                this.router.navigate(['/dashboard']);
        }).catch(
            (err) => {
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
                    this.router.navigate(['/login']);
            }).catch( 
                (err) => {
                    this.error = err.message;
                    this.ref.detectChanges();
            })
        }
    }
}
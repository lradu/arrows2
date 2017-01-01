import { Component, Inject } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html'
})

export class ProfileComponent { 
  public email: any;
  public auth: any;
  public emailSuccess: any;
  public passSuccess: any;
  public error: any;

  constructor(private af: AngularFire, @Inject(FirebaseApp) firebase: any) { 
    this.auth = firebase.auth().currentUser;
    this.email = this.auth.email;
  }

  onSubmit(formData) {
    console.log(formData.value,this.auth.email);
    //todo
    // alert doesn't work well inside firebase calls
    this.af.auth.login({
      email: this.auth.email,
      password: formData.value.pass
    }).then(
      (success) => {
        if(this.email != this.auth.email){
          this.auth.updateEmail(this.email)
            .then((success) => {
              this.emailSuccess = "Email update successfully.";
            }).catch((err) => {
              this.error = err.message;
              console.log(this.error);
            });
        }
        if(formData.value.new) {
          if(formData.value.new == formData.value.conf) {
            this.auth.updatePassword(formData.value.new)
              .then((success) => {
                console.log("Password update successfully.");
                this.passSuccess = "Password update successfully.";
              }).catch((err) => {
                console.log(err);
                this.error = err.message;
              })
          } else {
            this.error = "Passwords doesn't match.";
            console.log(this.error);
          }
        }
    }).catch(
      (err) => {
        console.log(err);
        this.error = err.message;
    }) 
  }
}

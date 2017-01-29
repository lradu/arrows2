import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent { 
  public email: any;
  public auth: any;
  public dbref: any;
  public emailSuccess: any;
  public passSuccess: any;
  public error: any;

  constructor(private af: AngularFire,
    @Inject(FirebaseApp) firebase: any,
    private ref: ChangeDetectorRef) { 
    this.dbref = firebase.database().ref();
    this.auth = firebase.auth().currentUser;
    this.email = this.auth.email;
  }

  onSubmit(formData) {
    this.af.auth.login({
      email: this.auth.email,
      password: formData.value.pass
    }).then(
      (success) => {
        if(this.email != this.auth.email){
          this.auth.updateEmail(this.email)
            .then((success) => {
              this.dbref
                .child("users/" + this.auth.uid + "/diagrams")
                .once('value', (snap) => {
                  let diagrams = Object.keys(snap.val());
                  let updateObj = {};
                  diagrams.forEach(key =>{
                    updateObj["diagrams/" + key + "/users/" + this.auth.uid + '/email'] = this.email;
                  });
                  updateObj["users/" + this.auth.uid + "/email"] = this.email;
                  this.dbref
                    .update(updateObj)
                    .then((success) => {
                      this.emailSuccess = "Email update successfully.";
                      this.ref.detectChanges();
                    })
                });
            }).catch((err) => {
              this.error = err.message;
              this.ref.detectChanges();
              console.log(this.error);
            });
        }
        if(formData.value.new) {
          if(formData.value.new == formData.value.conf) {
            this.auth.updatePassword(formData.value.new)
              .then((success) => {
                this.passSuccess = "Password update successfully.";
                this.ref.detectChanges();
                console.log("Password update successfully.");
              }).catch((err) => {
                this.error = err.message;
                this.ref.detectChanges();
                console.log(err);
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

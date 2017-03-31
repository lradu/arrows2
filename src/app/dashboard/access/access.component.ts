import { Component, AfterContentInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FirebaseApp } from 'angularfire2'

@Component({
  selector: 'access',
  templateUrl: './access.component.html',
  styleUrls: ['./access.component.css']
})
export class AccessComponent implements AfterContentInit {
	public dbref: any;
	public user: any;

	public access: string;
	public users: any;
	public error: any;
	public currentDiagram: string;
	public date: string;

  constructor(@Inject(FirebaseApp) firebase: any, private ref: ChangeDetectorRef) {
  	this.dbref = firebase.database().ref();
  	this.user = firebase.auth().currentUser;
  	this.date = new Date().toLocaleDateString();
  }

  ngAfterContentInit() {
  	this.dbref
  		.child('users/' + this.user.uid + '/currentDiagram')
  		.on('value', (snap) => {
  			this.currentDiagram = snap.val();
		  	this.dbref
		  		.child('diagrams/' + snap.val() + '/users') 
		  		.on('value', 
		  		(snapShot) => {
		  			// get users list from current diagram
		  			if(snap.val() == snapShot.ref.parent.key){
		  				let owner = [];
		  				let edit = [];
		  				let read = [];
		  				for(let key in snapShot.val()) {
		  					if(key==this.user.uid){
									this.access = snapShot.val()[key].access;   // currrent user access
								}
		  					if(snapShot.val()[key].access == 'Owner'){
		  						owner.push(snapShot.val()[key]);
		  					} else if(snapShot.val()[key].access == 'Editor'){
		  						edit.push(snapShot.val()[key]);
		  					} else {
		  						read.push(snapShot.val()[key]);
		  					}
		  					this.users = owner.concat(edit, read);
		  					this.ref.detectChanges();
		  				}
		  			}
		  		}); 
  	});
  }

  inviteUser(email, access){
  	if(email == this.user.email){
  		this.error = "You cannot change your status.";
  		setTimeout(() => {
  			this.error = '';
  		}, 3000);
  	} else {
  		this.dbref
  			.child('users')
  			.orderByChild('email')
  			.equalTo(email)
  			.once('value',
  				(snap) => {
  					if(snap.val()){
  						snap.forEach((snapChild) =>{
  							snapChild.ref.child('diagrams').update({
  								[this.currentDiagram]: true    // add diagram key to user
  							});
  							this.dbref
  								.child('diagrams/' + this.currentDiagram + '/users')
  								.update({
  									[snapChild.key]: {   // add user key to diagram
  										"access": access,
  										"email": email,
  										"dateAdded": this.date,
  										"lastUpdate": this.date
  									}
  								});
  						});
  					} else {
  						this.error = "User doesn't exist.";
  						setTimeout(() => {
  							this.error = '';
  						}, 3000);
  						this.ref.detectChanges();
  					}
  				});
  	}
  }

  removeUser(email){
  	this.dbref
  		.child('users')
  		.orderByChild('email')
  		.equalTo(email)
  		.once('value',
  			(snap) => {
  				snap.forEach((snapChild) =>{
  					snapChild.ref.child('diagrams/' + this.currentDiagram).remove();   	// remove diagram key from user
  					this.dbref
  						.child('diagrams/' + this.currentDiagram + '/users/' + snapChild.key).remove();   	// remove user key from diagram
  				});
  			});
  }

}

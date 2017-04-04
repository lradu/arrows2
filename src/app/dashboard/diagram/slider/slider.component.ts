import { Component, Inject, OnInit } from '@angular/core';
import { FirebaseApp } from 'angularfire2'

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {
	public dbref: any;
	public user: any;

	public playSlides: boolean = false;
	public speedSlider: number = 1300;

	public currentIndex: number = 1;
	public maxIndex: number = 0;
	public currentDiagram: string;

  constructor(@Inject(FirebaseApp) firebase: any) {
  	this.dbref = firebase.database().ref();
  	this.user = firebase.auth().currentUser;
  }

  ngOnInit() {
  	this.dbref
  		.child('users/' + this.user.uid + '/currentDiagram')
  		.once('value', (snap) => {
  			this.currentDiagram = snap.val();
  			let dref = this.dbref
  				.child('diagrams/' + this.currentDiagram);
  			dref.child('currentIndex')
  				.on('value', (snapShot) => {
  					if(snapShot.val()) {
  						this.currentIndex = snapShot.val();
  					}
  				});
  			dref.child('history')
  				.on('child_added', (snapShot) => {
  					this.maxIndex += 1;
  				});
  			dref.child('history')
  				.on('child_removed', (snapShot) => {
  					this.maxIndex -= 1;
  				});
  		});
  }

  changeSlide(index){
  	this.currentIndex = parseInt(index);
  	this.dbref
  		.child('diagrams/' + this.currentDiagram)
  		.update({
  			'currentIndex': this.currentIndex
  		});
  }

	playSlider(i){
		let interval = setInterval(() => {
			if(!this.playSlides){
				clearInterval(interval);
				return;
			}
			if(this.currentIndex + i > this.maxIndex){
				clearInterval(interval);
				this.playSlides = false;
				this.currentIndex = this.maxIndex;
				return;
			} else if(this.currentIndex + i < 1){
				clearInterval(interval);
				this.playSlides = false;
				this.currentIndex = 1;
				return;
			}
			this.changeSlide(this.currentIndex + i);
			}, 2300 - this.speedSlider);
	}

	replaySlider(){
		this.currentIndex = 1;
		this.playSlider(1);
	}

	/*
		
		Branch

	*/
	createBranch(title, choice){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/history')
			.orderByKey()
			.limitToFirst(this.currentIndex)
			.once('value', (snap) => {
				if(snap.val()){
					snap.ref.parent
						.child('users/' + this.user.uid + '/access')
						.once('value', (snapChild) => {
							this.newDiagram(snap.val()[this.currentIndex], snap.val(), snapChild.val(), title, choice);
					});
				}
			});
	}

	newDiagram(data, history, access, title, choice){
		let date = new Date().toLocaleDateString();
		this.dbref.child('diagrams/').push({
			"data": data,
			"history": history,
			"info" : {
        "created" : date,
        "lastUpdate" : date,
        "title" : title
      },
      "users" : {
        [this.user.uid] : {
          "access" : access,
          "dateAdded" : date,
          "email" : this.user.email,
          "lastUpdate" : date
        }
      }
		}).then(
			(newD) => {
				this.dbref
					.child('users/' + this.user.uid + '/diagrams')
					.update({
						[newD.key]: true
				});
				if(choice){
					return;
				}
				this.dbref
					.child('users/' + this.user.uid)
					.update({
						"currentDiagram": newD.key
					})
			});
	}
}

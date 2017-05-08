import { Component, Inject, OnInit } from '@angular/core';
import { FirebaseApp } from 'angularfire2'

import { Database } from '../shared/diagram.service';

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  providers: [Database]
})
export class SliderComponent implements OnInit {
	public dbref: any;
	public user: any;

    // turn off the slides transition
	public playSlides: boolean = false;
    // duration of a transition
	public speedSlider: number = 1300;

    // current point in history for the current diagram
	public currentIndex: number = 1;
    // last point in history for the current diagram
	public maxIndex: number = 0;

	public currentDiagram: string;

  constructor(@Inject(FirebaseApp) firebase: any, private db: Database) {
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
							this.db.newDiagram(snapChild.val(), title, snap.val()[this.currentIndex], snap.val())
                                .then((diagram) => {
                                    if(choice){
                                        this.db.changeDiagram(diagram.key);
                                    }
                                });
					});
				}
			});
	}
}

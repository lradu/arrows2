import { Component, AfterViewInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FirebaseApp } from 'angularfire2'
import { AddData } from '../diagram/diagram.service';

@Component({
  selector: 'diagrams',
  templateUrl: './diagrams.component.html',
  styleUrls: ['./diagrams.component.css'],
  providers: [AddData]
})
export class DiagramsComponent implements AfterViewInit {
	public dbref: any;
	public user: any;

	public diagrams: any;              // diagram list
	public diagramsKey: any;           // diagram list copy

	public asc: boolean;               // sort - ascending/descending
	public col: string;                // sort - column

  constructor(
  	@Inject(FirebaseApp) firebase: any,
  	private ref: ChangeDetectorRef,
  	private addData: AddData
  	) {
  	this.dbref = firebase.database().ref();
  	this.user = firebase.auth().currentUser;
  	this.diagramsKey = {};
  	this.diagrams = [];
  }

  ngAfterViewInit() {
  	//get diagrams list
  	this.dbref
  		.child('users/' + this.user.uid + '/sortAccess')
  		.once('value', (sortAccess) => {
  			this.col = sortAccess.val().col;
  			this.asc = sortAccess.val().asc;
				sortAccess.ref.parent
					.child('diagrams')
					.on('child_added', (snap) => {
						let item = {
							"key": snap.key,
							"access": "NaN",
							"created": "NaN",
							"lastUpdate": "NaN",
							"title": "NaN"
						};
						this.dbref
							.child('diagrams/' + snap.key + '/info')
							.on('value', (info) => {
								if(info.val()){
									item['created'] = info.val().created;
									item['lastUpdate'] = info.val().lastUpdate;
									item['title'] = info.val().title;
									this.sortDiagrams(this.col, this.asc);
								}
							});
						this.dbref
							.child('diagrams/' + snap.key + '/users/' + this.user.uid + '/access')
							.on('value', (access) => {
								if(access.val()){
									item["access"] = access.val();
									this.sortDiagrams(this.col, this.asc);
								}
							});
						this.diagramsKey[snap.key] = item;
					}) 			
  		});
  }

  sortDiagrams(col, asc){ 
  	this.diagrams = [];
  	this.asc = asc;
  	this.col = col;
  	this.dbref
  		.child('users/' + this.user.uid +'/sortAccess')
  		.update({
  			"asc": asc,
  			"col": col
  		});

  	for(let d in this.diagramsKey){
  		this.diagrams.push(this.diagramsKey[d]);
  	}
  	this.diagrams.sort(function(a, b) {
  		return asc ? (a[col].toLowerCase() < b[col].toLowerCase()) : (a[col].toLowerCase() > b[col].toLowerCase());
  	});
  	this.ref.detectChanges();
  }

  filterDiagrams(value){
  	let reg = new RegExp(value.split('').join('\\w*'), 'i');
  	this.diagrams.forEach(function(item){
  		item.hide = true;
  	});
  	this.diagrams.filter(function(item){
  		if(item.title.match(reg)){
  			item["hide"] = '';
  		}
  	})
  }

  removeDiagram(diagram, access){
  	for(let d in this.diagramsKey){
  		if(d!=diagram){
  			this.changeDiagram(d);
  			break;
  		}
  	}
  	if(access=='Owner'){
  		//only the owner can remove the diagram
  		this.dbref
  			.child('diagrams/' + diagram)
  			.remove();
  		} else {
  			//the editor, read only user can remove himself from the diagram
  			this.dbref
  				.child('diagrams/' + diagram + '/users/' + this.user.uid)
  				.remove();
  		}
  	this.dbref
  		.child('users/' + this.user.uid + '/diagrams/' + diagram)
  		.remove();

  	delete this.diagramsKey[diagram];
  	this.sortDiagrams(this.col, this.asc);
  }

  changeDiagram(diagram){
  	this.dbref
  		.child('users/' + this.user.uid)
  		.update({
  			"currentDiagram": diagram
  		})
  }

  onEvent(event) {
     event.stopPropagation();
  }

}

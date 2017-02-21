import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2'
import { Router } from '@angular/router';

import { DiagramComponent } from './diagram/diagram.component';
import { Node } from './diagram/graph/node';
import { ExportData } from './dashboard.service';
import * as d3 from 'd3';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [ExportData]
})

export class DashboardComponent {
	public dbref: any;
	public user: any;

	public title: string;
	public users: any;
	public error: any;
	public diagrams: any;
	public diagramsKey: any;
	public currentDiagram: string;
	public access: string;

	public asc: boolean;
	public col: string;
	public date: string;

	public importFileName: string = "Choose file...";
	public importError: string;
	public showImport: boolean = false;
	public importReady: string;
	public importData: any;
	public importSuccess: string;

	constructor(
		private af: AngularFire,
		@Inject(FirebaseApp) firebase: any,
		private router: Router,
		private ref: ChangeDetectorRef,
		private exportData: ExportData
		) {
			this.dbref = firebase.database().ref();
			this.user = firebase.auth().currentUser;
			this.diagramsKey = {};
			this.diagrams = [];
			this.date = new Date().toLocaleDateString();
			this.loadData();
	}

	loadData(){
		this.dbref
			.child('users/' + this.user.uid )
			.once('value', 
			(snap) => { 
				//diagrams
				for(let key in snap.val().diagrams){
					this.dbref
						.child('diagrams/' + key)
						.on('value',
						(snapShot) => {
							if(snapShot.val()){
								let item = snapShot.child('info').val();
								item['access'] = snapShot.child('users/' + this.user.uid + '/access').val();
								item['key'] = snapShot.key;
								this.diagramsKey[key] = item;
								this.sortDiagrams(snap.val().sortAccess.col, snap.val().sortAccess.asc);
							} else {
								delete this.diagramsKey[snapShot.key];
								this.sortDiagrams(snap.val().sortAccess.col, snap.val().sortAccess.asc);
							}
						})
				}
		});
		this.dbref
			.child('users/' + this.user.uid + '/currentDiagram')
			.on('value',
				(snap) => {
					//current diagram
					this.currentDiagram = snap.val();

					//update date
					this.dbref
						.child('diagrams/' + this.currentDiagram + '/info')
						.update({
							"lastUpdate": this.date
						});
					//title
					this.dbref
						.child('diagrams/' + snap.val() + '/info/title')
						.on('value',
						(snapShot) => { 
							if(this.currentDiagram == snapShot.ref.parent.parent.key){
								this.title = snapShot.val();
								this.ref.detectChanges();
							}
						});
					//users
					this.dbref
						.child('diagrams/' + snap.val() + '/users') 
						.on('value', 
						(snapShot) => {
							if(this.currentDiagram == snapShot.ref.parent.key){
								let owner = [];
								let edit = [];
								let read = [];
								for(let key in snapShot.val()) { //todo - improve this
									if(key==this.user.uid){
										this.access = snapShot.val()[key].access;
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

	sortDiagrams(col, asc){  //todo: create a pipe 
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

	newDiagram(nodes){
		let l = {};
		if(nodes){
			for(let n of nodes){
				l[n.id] = n;
			}
		} else {
			l["firstNode"] = new Node();
		}
		this.dbref.child('diagrams/').push({
			"data": {
				"nodes": l
			},
			"info" : {
        "created" : this.date,
        "lastUpdate" : this.date,
        "title" : "My new diagram"
      },
      "users" : {
        [this.user.uid] : {
          "access" : "Owner",
          "dateAdded" : this.date,
          "email" : this.user.email,
          "lastUpdate" : this.date
        }
      }
		}).then(
			(newD) => {
				this.dbref
					.child('users/' + this.user.uid + '/diagrams')
					.update({
						[newD.key]: true
				});
				newD.on('value', 
					(snap) => {
						if(snap.val()){
							this.dbref
								.child('users/' + this.user.uid)
								.update({
									"currentDiagram": newD.key
								})
							let item = snap.child('info').val();
							item['access'] = snap.child('users/' + this.user.uid + '/access').val();
							item['key'] = snap.key;
							this.diagramsKey[newD.key] = item;
							this.sortDiagrams(this.col, this.asc);
						} else {
							delete this.diagramsKey[snap.key];
							this.sortDiagrams(this.col, this.asc);
						}
					}
				);
			}
		);
	}

	removeDiagram(diagram, access){
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
	}

	changeDiagram(diagram){
		this.dbref
			.child('users/' + this.user.uid)
			.update({
				"currentDiagram": diagram
			})
	}

	changeTitle(title){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/info')
			.update({
				"title": title
			})
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
									[this.currentDiagram]: true
								});
								this.dbref
									.child('diagrams/' + this.currentDiagram + '/users')
									.update({
										[snapChild.key]: {
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
						snapChild.ref.child('diagrams/' + this.currentDiagram).remove();
						this.dbref
							.child('diagrams/' + this.currentDiagram + '/users/' + snapChild.key).remove();
					});
				});
	}
	downloadSample(){
		let head = "caption,id,isRectangle,properties_text,properties_width,radius,style_color,style_fill,style_stroke,style_strokeWidth,x,y\r\n";
		let csv = document.createElement('a');
		let csvContent = head;
		let blob = new Blob([csvContent],{type: 'text/csv;charset=utf-8;'});
		let url = URL.createObjectURL(blob);
		csv.href = url;
		csv.setAttribute('download', 'sample-nodes.csv');
		document.body.appendChild(csv);
		csv.click();
		csv.remove();
	}
	importCSV(event){
		this.importError = "";
		let nodes = [];
		let files = event.target.files;
		if(files.length){
			let head = "caption,id,isRectangle,properties_text,properties_width,radius,style_color,style_fill,style_stroke,style_strokeWidth,x,y";
			this.importFileName = files[0].name;
			let reader = new FileReader();
			reader.readAsText(files[0]); 
			reader.onload = (event) => {
				let data = event.target["result"];
				let lines = data.split("\r\n");
				let header = lines[0];

				if(header != head || lines.length < 2){
					this.importError = "Wrong data format.";
					return;
				} else {
					header = header.split(',');
					for(let i = 1; i < lines.length; i++){
						let line = lines[i].split(",");
						if(line.length == header.length) {
							let node = new Node()
							for(let j = 0; j < line.length; j++){
								let keys = header[j].split("_");
								if(line[j] === "false"){ line[j] = false }
								if(line[j] === "true"){ line[j] = true }
								if(keys.length == 1){
									if(typeof node[keys[0]] === "number"){ line[j] = Number(line[j]); }
									node[keys[0]] = line[j] === "null" ? "":line[j];
								} else {
									if(typeof node[keys[0]][keys[1]] === "number"){ line[j] = Number(line[j]); }
									node[keys[0]][keys[1]] = line[j] === "null" ? "":line[j];
								}
							}
							nodes.push(node);
						}
					}
					if(nodes.length){
						this.importData = nodes; 
						this.importReady = "Import";
					} else {
						this.importError = "Wrong data format.";
						return;
					}
				}
			}
		}
	}
	importNodes(){
		this.importReady = "Importing...";
		this.newDiagram(this.importData);
		this.importReady = "";
		this.importFileName = "Choose file...";
		this.importSuccess = "Success.";
		setTimeout(()=>{ this.importSuccess = ""; }, 4000);
	}
	exportCSV(path){	
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/' + path)
			.once("value", 
				(snap) => {
					this.exportData.csv(snap.val(), path);
				});		
	}
	exportSVG(){
		this.exportData.svg();
	}
	exportCypher(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data')
			.once("value", 
				(snap) => {
					this.exportData.cypher(snap.val());
				});	
	}
	exportMarkup(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data')
			.once("value", 
				(snap) => {
					this.exportData.markup(snap.val());
				});
	}
	onEvent(event) {
	   event.stopPropagation();
	}

	logout() {
	  this.af.auth.logout();
	  this.router.navigate([""]);
	}
}
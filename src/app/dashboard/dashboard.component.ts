import { Component, AfterViewInit, Inject, ChangeDetectorRef } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2'
import { Router } from '@angular/router';

import { DiagramComponent } from './diagram/diagram.component';
import { DiagramsComponent } from './diagrams/diagrams.component';
import { AccessComponent } from './access/access.component';

import { Node } from './diagram/graph/node';
import { ExportData } from './dashboard.service';
import { AddData } from './diagram/diagram.service';
import * as d3 from 'd3';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [ExportData, AddData]
})

export class DashboardComponent implements AfterViewInit {
	public dbref: any;
	public user: any;

	public title: string;
	public currentDiagram: string;

	public importFileName: string = "Choose file...";
	public importError: string;
	public importReady: string;
	public importData: any;
	public importSuccess: string;

	public showDiagrams: boolean = false;
	public showAccess:boolean = false;


	constructor(
		private af: AngularFire,
		@Inject(FirebaseApp) firebase: any,
		private router: Router,
		private ref: ChangeDetectorRef,
		private exportData: ExportData,
		private addData: AddData
		) {
		this.dbref = firebase.database().ref();
		this.user = firebase.auth().currentUser;
	}
	
	ngAfterViewInit(){
		let date = new Date().toLocaleDateString();
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
							"lastUpdate": date
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
				});
	}

	changeTitle(title){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/info')
			.update({
				"title": title
			})
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
						this.importData = {
							"nodes": nodes
						}; 
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
		let date = new Date().toLocaleDateString();
		this.importReady = "Importing...";
		this.addData.newDiagram(this.importData, date);
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
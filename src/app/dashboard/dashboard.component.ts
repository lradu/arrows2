import { Component, AfterViewInit, Inject, ChangeDetectorRef } from '@angular/core';
import { AngularFire, FirebaseApp } from 'angularfire2'
import { Router } from '@angular/router';

import { DiagramComponent } from './diagram/diagram.component';
import { DiagramListComponent } from './diagram-list/diagram-list.component';
import { AccessListComponent } from './access-list/access-list.component';

import { Node } from './diagram/models/node.model';
import { Database } from './diagram/shared/diagram.service';
import * as d3 from 'd3';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [Database]
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

	public exportData: any;
	public exportType: string;

	public showDiagrams: boolean = false;
	public showAccess: boolean = false;
	public showExport: boolean = false;

	constructor(
		private af: AngularFire,
		@Inject(FirebaseApp) firebase: any,
		private router: Router,
		private ref: ChangeDetectorRef,
		private db: Database
		) {
		this.dbref = firebase.database().ref();
		this.user = firebase.auth().currentUser;
	}
	
	ngAfterViewInit(){
		this.dbref
			.child('users/' + this.user.uid + '/currentDiagram')
			.on('value',
				(snap) => {
					if(!snap.val()){ return; }
					
					//current diagram
					this.currentDiagram = snap.val();
						
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
		let node = new Node();
		let head = Object.keys(node).sort().toString() + "\n";

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
		let nodes = {};
		let files = event.target.files;

		if(files.length){
			let node = new Node();
			let head = Object.keys(node).sort();
			this.importFileName = files[0].name;

			// parse file
			let reader = new FileReader();
			reader.readAsText(files[0]); 
			reader.onload = (event) => {
				let data = event.target["result"];
				let lines = data.split("\n");
				let header = lines[0].trim(" ").split(',');

				// check if headers match
				if(header.toString() != head.toString() || lines.length < 2){
					this.importError = "Wrong data format.";
					return;
				} else {
					// parse data
					for(var i = 1; i < lines.length; i++) {
						lines[i] = lines[i].split(',');
						node = new Node();
						lines[i].map((x, j) => {
							if(typeof(node[header[j]]) === 'number'){
								x = Number(x);
							} else if(typeof(node[header[j]]) === 'boolean'){
								x === "true" ? x = true : x = false;
							} else if(x === 'null'){
								x = ""
							}
							node[header[j]] = x;
						});
						nodes[node.id] = node;
					}
				}
				// data to import
				this.importData = {
					"nodes": nodes
				}; 
				// shows the import button
				this.importReady = "Import";
			}
		}
	}

	importNodes(){
		let date = new Date().toLocaleDateString();

		this.importReady = "Importing...";
		this.db.newDiagram("Owner", "My new diagram", this.importData, date);
		this.importReady = "";
		this.importFileName = "Choose file...";
		this.importSuccess = "Success.";

		// hide the success message
		setTimeout(() => { this.importSuccess = ""; }, 4000);
	}

	exportCSV(path){ 
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data/' + path)
			.once("value", 
				(snap) => {
					this.exportData = snap.val();
					this.exportType = path + "CSV";
					this.showExport = true;
				});		
	}

	exportCypher(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data')
			.once("value", 
				(snap) => {
					this.exportData = snap.val();
					this.exportType = "cypher";
					this.showExport = true;
				});	
	}

	exportMarkup(){
		this.dbref
			.child('diagrams/' + this.currentDiagram + '/data')
			.once("value", 
				(snap) => {
					this.exportData = snap.val();
					this.exportType = "markup";
					this.showExport = true;
				});
	}

	exportSVG(){
		let svg = document.getElementsByTagName("svg");
		if(svg){
			let rawSvg = new XMLSerializer().serializeToString(svg[0]);
			window.open( "data:image/svg+xml;base64," + btoa(rawSvg) );
		}
	}

	onEvent(event) {
	   event.stopPropagation();
	}

	logout() {
	  this.af.auth.logout();
	  this.router.navigate([""]);
	}
}
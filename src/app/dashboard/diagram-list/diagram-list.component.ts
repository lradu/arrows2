import { Component, AfterViewInit, Inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { FirebaseApp } from 'angularfire2'

import { Database } from '../diagram/shared/diagram.service';
import { Node } from '../diagram/models/node.model';

@Component({
    selector: 'diagram-list',
    templateUrl: './diagram-list.component.html',
    styleUrls: ['./diagram-list.component.css'],
    providers: [Database]
})
export class DiagramListComponent implements AfterViewInit {
    public dbref: any;
    public user: any;

    // diagrams-list object
    public diagramsKey: any;

    // diagram list
    public diagrams: any;

    // sort - ascending/descending
    public asc: boolean;

    // sort - column
    public col: string;

    constructor(
        @Inject(FirebaseApp) firebase: any,
        private ref: ChangeDetectorRef,
        private router: Router,
        private db: Database
    ) {
        this.dbref = firebase.database().ref();
        this.user = firebase.auth().currentUser;
        this.diagramsKey = {};
        this.diagrams = [];
    }

    ngAfterViewInit() {
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
        this.diagrams = Object.keys(this.diagramsKey).map(key => this.diagramsKey[key]);
        this.asc = asc;
        this.col = col;
        this.db.updateSort(asc, col);

        this.diagrams.sort((a, b) => {
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

    addNewDiagram(){
        let data = {
            "nodes": {
                "firstNode": new Node()
            }
        }
        this.db.newDiagram(
            "Owner", 
            "My new diagram",
            data,
            {
                "1": data
            }
        ).then((diagram) => {
            this.db.changeDiagram(diagram.key);
        });
    }

    removeDiagram(diagram, access){
        this.db.deleteDiagram(diagram, access);

        delete this.diagramsKey[diagram];
        this.sortDiagrams(this.col, this.asc);
    }

    onEvent(event) {
        event.stopPropagation();
    }

}

import { Injectable, Inject } from '@angular/core';
import { FirebaseApp } from 'angularfire2'
import { Node } from './graph/node';

@Injectable()
export class AddData {
	public dbref: any;
	public user: any;

	constructor(@Inject(FirebaseApp) firebase: any){
		this.dbref = firebase.database().ref();
		this.user = firebase.auth().currentUser;
	}
	newDiagram(data, date){
		if(!data){
			data = {
				"nodes": {
					"firstNode": new Node()
				}
			}
		}
		this.dbref.child('diagrams/').push({
			"data": data,
			"info" : {
        "created" : date,
        "lastUpdate" : date,
        "title" : "My new diagram"
      },
      "users" : {
        [this.user.uid] : {
          "access" : "Owner",
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
				this.dbref
					.child('users/' + this.user.uid)
					.update({
						"currentDiagram": newD.key
					})
			}
		);
	}

}
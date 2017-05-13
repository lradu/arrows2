import { Injectable, Inject } from '@angular/core';
import { FirebaseApp } from 'angularfire2'

@Injectable()
export class Database {
    public dbref: any;
    public user: any;

    constructor(@Inject(FirebaseApp) firebase: any){
        this.dbref = firebase.database().ref();
        this.user = firebase.auth().currentUser;
    }


    /* Diagram */

    newDiagram(access, title, data, history){
        let date = new Date().toLocaleDateString();
        let diagram = {
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
        }
        let promise = this.dbref.child('diagrams/').push(diagram);
        promise.then(
                (newD) => {
                    this.dbref
                        .child('users/' + this.user.uid + '/diagrams')
                        .update({
                            [newD.key]: true
                    });
                }
        );
        return promise;
            
    }

    deleteDiagram(diagram, access){
        if(access === 'Owner'){
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
        return this.dbref
            .child('users/' + this.user.uid + '/diagrams/' + diagram)
            .remove();
    }

    changeDiagram(diagram){
        return this.dbref
            .child('users/' + this.user.uid)
            .update({
                "currentDiagram": diagram
        });
    }

    /* Node */

    addNode(node, diagram){
        this.dbref
            .child('diagrams/' + diagram+ '/data/nodes')
            .push(node)
            .then((newNode) => {
                newNode.ref.update({
                            "id": newNode.key
                        }).then(
                        (success) =>{
                            this.updateHistory(diagram);
                        });
            });
    }

    saveNode(node, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/data/nodes/' + node.id)
            .update({
                "caption": node.caption,
                "isRectangle": node.isRectangle,
                "radius": node.radius,
                "fill": node.fill,
                "color": node.color,
                "properties": node.properties,
                "propertiesWidth": node.propertiesWidth
            }).then((success) => {
                    this.updateHistory(diagram);
            });
    }

    deleteNode(updateObj, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/data')
            .update(updateObj)
            .then((success) =>{
                this.updateHistory(diagram);
            });
    }


    /* Relationship */

    addR(rel, group, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/data/relationships/' + group)
            .push(rel)
            .then((newRel) => {
                this.dbref
                    .child('diagrams/' + diagram + '/data/relationships/' + group + "/" + newRel.key)
                    .update({
                        "id": newRel.key
                    }).then(
                    (success) =>{
                        this.updateHistory(diagram);
                    });
            });       
    }

    saveR(rel, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/data/relationships/' + rel.group + "/" + rel.id)
            .update({
                "type": rel.type,
                "fill": rel.fill,
                "properties": rel.properties,
                "propertiesWidth": rel.propertiesWidth
            }).then(
        (success) =>{
            this.updateHistory(diagram);
        });
    }

    deleteR(rel, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/data/relationships/' + rel.group + "/" + rel.id)
            .remove()
            .then(
            (success) =>{
                this.updateHistory(diagram);
            });
    }

    reverseR(rel, diagram){
       rel.reverse();
        this.dbref
            .child('diagrams/' + diagram + '/data/relationships/' + rel.group + "/" + rel.id)
            .update({
                "startNode": rel.startNode,
                "endNode": rel.endNode
            })
            .then(
            (success) =>{
                this.updateHistory(diagram);
            });
    }

    /* History */

    updateHistory(diagram){
        this.dbref
            .child('diagrams/' + diagram + '/currentIndex')
            .once('value',
                (snap) => {
                    snap.ref.parent
                        .child('data')
                        .once('value', (snapShot) => {
                            snap.ref.parent.child('history')
                                .update({
                                    ['' + (snap.val() + 1)]: snapShot.val()
                                }).then(() => {
                                    this.lastUpdate(diagram);        
                                });
                            snap.ref.parent
                                .update({
                                    'currentIndex': snap.val() + 1
                                }).then((success) => {
                                    this.dbref
                                        .child('diagrams/' + diagram + '/history')
                                        .orderByKey()
                                        .startAt('' + (snap.val() + 2))
                                        .once('value', (snapChild => {
                                            snapChild.forEach((child) => {
                                                child.ref.remove();
                                            })
                                        }));
                                });
                        });
            });
    }

    lastUpdate(diagram) {
        let date = new Date().toLocaleDateString();

        this.dbref
            .child("diagrams/"  + diagram + "/info")
            .update({
                "lastUpdate": date
            });
    }
    
    changeHistory(index, diagram){
        this.dbref
            .child('diagrams/' + diagram + '/currentIndex')
            .once('value',
                (snap) => {
                    snap.ref.parent
                        .child('history/' + (snap.val() + index))
                        .once('value', (snapshot) => {
                            if(snapshot.val()){
                                snap.ref.parent.update({
                                    'currentIndex': snap.val() + index
                                });
                            }
                        });
                });
    }

    updateSort(asc, col) {
        return this.dbref
            .child('users/' + this.user.uid +'/sortAccess')
            .update({
                "asc": asc,
                "col": col
        });
    }


}
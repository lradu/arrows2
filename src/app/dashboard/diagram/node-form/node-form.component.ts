import { Component, AfterViewInit } from '@angular/core';

import { Database } from '../shared/diagram.service';

@Component({
    selector: 'node-form',
    templateUrl: './node-form.component.html',
    styleUrls: ['./node-form.component.css'],
    providers: [Database]
})
export class NodeFormComponent implements AfterViewInit {
    public node: any;
    constructor( private db: Database ) {}

    ngAfterViewInit() {
    }

    save() {

    }

    // changeColor(color){
    //     if(this.showNodeTools){
    //         if(this.propColor == 1){
    //             this.currentNode.style.color = color;
    //         } else {
    //             this.currentNode.style.fill = color;
    //         }
    //     } else {
    //         this.currentR.style.fill = color;
    //     }
    // }

}

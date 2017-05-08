import { Component, AfterViewInit } from '@angular/core';

import { Database } from '../shared/diagram.service';

@Component({
    selector: 'relationship-form',
    templateUrl: './relationship-form.component.html',
    styleUrls: ['./relationship-form.component.css'],
    providers: [Database]
})
export class RelationshipFormComponent implements AfterViewInit {
    public relationship: any;

    constructor( private db: Database ) {}

    ngAfterViewInit() {;
    }

    save(){

    }

    reverse(){
        
    }

}

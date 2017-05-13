import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'relationship-form',
    templateUrl: './relationship-form.component.html',
    styleUrls: ['./relationship-form.component.css'],
})
export class RelationshipFormComponent {
    @Input() relationship: any;
    @Input() 
    set color(color: string){
        if(color) {
            this.relationship.fill = color;
        }
    }

    @Output() saveR= new EventEmitter<any>();
    @Output() deleteR = new EventEmitter<any>();
    @Output() reverseR = new EventEmitter<any>();

    constructor() {}

    save(){
        this.saveR.emit(this.relationship);
    }

    delete(){
        this.deleteR.emit(this.relationship);
    }

    reverse(){
        this.reverseR.emit(this.relationship);
    }

}

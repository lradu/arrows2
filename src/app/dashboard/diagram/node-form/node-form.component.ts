import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'node-form',
    templateUrl: './node-form.component.html',
    styleUrls: ['./node-form.component.css'],
})
export class NodeFormComponent {
    isColor: boolean = true;
    @Input() node: any;
    @Input() 
    set color(color: string){
        if(this.isColor && color) {
            this.node.color = color;
        } else if (color) {
            this.node.fill = color;
        }
    }

    @Output() saveNode = new EventEmitter<any>();
    @Output() deleteNode = new EventEmitter<string>();

    constructor() {}

    save() {  
        this.saveNode.emit(this.node);
    }

    delete(){
        this.deleteNode.emit(this.node.id);
    }
}

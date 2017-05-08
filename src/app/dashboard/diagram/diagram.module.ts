import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


import { DiagramComponent } from './diagram.component';
import { SliderComponent } from './slider/slider.component';
import { ColorsComponent } from './colors/colors.component';
import { NodeFormComponent } from './node-form/node-form.component';
import { RelationshipFormComponent } from './relationship-form/relationship-form.component';

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
    ],
    declarations: [
        DiagramComponent,
        SliderComponent,
        ColorsComponent,
        NodeFormComponent,
        RelationshipFormComponent
    ]
})
export class DiagramModule { }
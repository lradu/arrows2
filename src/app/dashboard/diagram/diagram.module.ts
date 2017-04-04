import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


import { DiagramComponent } from './diagram.component';
import { SliderComponent } from './slider/slider.component';

@NgModule({
  imports: [
  	FormsModule,
  	CommonModule,
  ],
  declarations: [
  	DiagramComponent,
    SliderComponent,
  ]
})
export class DiagramModule { }
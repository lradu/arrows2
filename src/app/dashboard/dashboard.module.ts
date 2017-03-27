import { NgModule }      from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthGuard } from '../auth/auth-guard.service';

import { dashRouting } from './dashboard.routing';
import { DashboardComponent } from './dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { DiagramComponent } from './diagram/diagram.component';
import { DiagramsComponent } from './diagrams/diagrams.component';

@NgModule({
  imports:      [ 
    dashRouting,
    FormsModule,
    CommonModule
   ],
  providers: [AuthGuard],
  declarations: [ 
    DashboardComponent,
    ProfileComponent,
    DiagramComponent,
    DiagramsComponent,
  ]
})
export class DashModule { }
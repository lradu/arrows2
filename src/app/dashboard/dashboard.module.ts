import { NgModule }      from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthGuard } from '../auth/auth-guard.service';

import { dashRouting } from './dashboard.routing';
import { DashboardComponent } from './dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { DiagramModule } from './diagram/diagram.module';
import { DiagramListComponent } from './diagram-list/diagram-list.component';
import { AccessListComponent } from './access-list/access-list.component';

@NgModule({
    imports:[ 
        dashRouting,
        FormsModule,
        CommonModule,
        DiagramModule
    ],
        providers: [AuthGuard],
        declarations: [ 
        DashboardComponent,
        ProfileComponent,
        DiagramListComponent,
        AccessListComponent,
    ]
})
export class DashModule {}
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard.component';
import { ProfileComponent } from './profile.component';
import { DiagramComponent } from './diagram.component';
import { AuthGuard } from '../auth/auth-guard.service';

const appRoutes: Routes = [
 {  path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DiagramComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
];

export const dashRouting: ModuleWithProviders = RouterModule.forChild(appRoutes);
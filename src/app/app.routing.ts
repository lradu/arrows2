import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent, SignupComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth-guard.service';
import { DashboardComponent } from './dashboard/dashboard.component';

const appRoutes: Routes = [
    { path: '', component: HomeComponent }
];

export const AppRouting: ModuleWithProviders = RouterModule.forRoot(appRoutes);
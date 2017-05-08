import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';

import { AngularFireModule,
    FIREBASE_PROVIDERS,
    AngularFire,
    AuthMethods,
    AuthProviders
} from 'angularfire2';

import { AuthModule } from './auth/auth.module';
import { AppRouting } from './app.routing';
import { HomeComponent } from './home/home.component';
import { DashModule } from './dashboard/dashboard.module';


export const firebaseConfig = {
    apiKey: "AIzaSyBFWt-1413d9JUssE3mNA6eh3wbM5rIPvc",
    authDomain: "arrows2-f9ed8.firebaseapp.com",
    databaseURL: "https://arrows2-f9ed8.firebaseio.com",
    storageBucket: "arrows2-f9ed8.appspot.com",
    messagingSenderId: "453915506998"
};

export const firebaseAuthConfig = {
    provider: AuthProviders.Password,
    method: AuthMethods.Password
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
    ],
    imports: [
        BrowserModule,
        AngularFireModule.initializeApp(firebaseConfig, firebaseAuthConfig),
        AuthModule,
        DashModule,
        AppRouting,
        CommonModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

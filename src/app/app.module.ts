import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';


export const firebaseConfig = {
  apiKey: "AIzaSyBFWt-1413d9JUssE3mNA6eh3wbM5rIPvc",
  authDomain: "arrows2-f9ed8.firebaseapp.com",
  databaseURL: "https://arrows2-f9ed8.firebaseio.com",
  storageBucket: "arrows2-f9ed8.appspot.com",
  messagingSenderId: "453915506998"
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

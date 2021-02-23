import { SubcriptionComponent } from './components/subcription/subcription.component';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import { LoginComponent } from './components/login/login.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http'
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AddressComponent } from './components/address/address.component';
import { PaymentComponent } from './components/payment/payment.component';
import {FormsModule} from '@angular/forms';
import { AddPoolComponent } from './components/add-pool/add-pool.component';
import { ServiceDetailsComponent } from './components/service-details/service-details.component';
import { PoolDetailsComponent } from './components/pool-details/pool-details.component';
import { ServiceListComponent } from './components/service-list/service-list.component';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AddNewCardComponent } from './components/add-new-card/add-new-card.component';

@NgModule({
  declarations: [
    AppComponent,
      AddressComponent,
      PaymentComponent,
      AddPoolComponent,
      ServiceDetailsComponent,
      PoolDetailsComponent,
      ServiceListComponent,
      LoginComponent,
      AddNewCardComponent,
      SubcriptionComponent
   ],
  imports: [
    FormsModule,
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

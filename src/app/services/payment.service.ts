
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private dbPath = 'payments';
  userId: string;

  constructor(private db: AngularFireDatabase, private afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe((auth) => {
      if(auth) this.userId = auth.email;
      console.log(this.userId);
    });

    this.userId
    console.log(this.userId);
   }


   processPayment(token: any, amount) {
    const payment = {}
    return this.db.list(`${this.dbPath}/${this.userId}`).push(payment)
   }


}

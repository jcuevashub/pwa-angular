import { PaymentMethods } from './../../models/payment-methods';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Component, ElementRef, ViewChild, NgZone, ChangeDetectorRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-add-new-card',
  templateUrl: './add-new-card.component.html',
  styleUrls: ['./add-new-card.component.css']
})
export class AddNewCardComponent implements AfterViewInit, OnDestroy, OnInit{
  @ViewChild('cardInfo') cardInfo: ElementRef;
  card: any;
  cardHandler = this.onChange.bind(this);
  cardError: string;
  currentUser: string;
  customerData: any;
  cardholderName: string = 'Jackson Cuevas';
  paymentMethods: Array<PaymentMethods>;

  constructor(private cd: ChangeDetectorRef, private NgZone: NgZone, private firebase: AngularFirestore, public afAuth: AngularFireAuth) {
    var user = this.afAuth.currentUser
    console.log(user);
    this.afAuth.authState.subscribe((auth) => {
        this.currentUser = auth.uid;
        this.getAllPaymentMethods();
      });

   }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    const style = {
      base: {
        color: '#32325D',
        fontWeight: 500,
        fontFamily: 'Source Code Pro, Consolas, Menlo, monospace',
        fontSize: '16px',
        fontSmoothing: 'antialiased',

        '::placeholder': {
          color: '#CFD7DF',
        },
        ':-webkit-autofill': {
          color: '#e39f48',
        },
      },
      invalid: {
        color: '#E25950',

        '::placeholder': {
          color: '#cecece',
        },
      },
    };

    this.card = elements.create('card',{hidePostalCode: true, style});
    this.card.mount(this.cardInfo.nativeElement);
    this.card.on('change', ({ error }) => {
      if (error) {
        console.log("CARD"+error.message);
      }
    });
    this.card.addEventListener('change', this.cardHandler);

  }

  ngOnDestroy() {
    this.card.removeEventListener('change', this.cardHandler);
    this.card.destroy();
  }

  onChange({error}) {
    if(error) {
      this.NgZone.run(() => {
        this.cardError = error.message;
      })

    } else {
      this.cardError = null;
    }
    this.cd.detectChanges();
  }

  async addNewCard() {

    const doc = await this.firebase
                      .firestore
                      .collection('customers')
                      .doc(this.currentUser)
                      .get();

    if (!doc.exists) {
      console.log('No such document!');
    } else {
      this.firebase.firestore
      .collection('customers')
      .doc(this.currentUser)
      .collection('payment_methods')

      const {setupIntent, error} = await stripe.confirmCardSetup(
        doc.data().setup_secret,
        {
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.cardholderName,
            },
          },
        },
      );

      if(error) {
        console.log("UN ERROR:"+error);
      }

      await this.firebase
      .firestore
      .collection('customers')
      .doc(this.currentUser)
      .collection('payment_methods')
      .add({ id: setupIntent.payment_method});    }

  }

  async getAllPaymentMethods() {
    await this.firebase
    .firestore
    .collection('customers')
    .doc(this.currentUser)
    .collection("payment_methods").get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const paymentMethod = doc.data();
        if (!paymentMethod.card) {
          return;
        }
        const optionId = `card-${doc.id}`;
        const paymentValue = paymentMethod.id;
        console.log(paymentValue);
        console.log(`${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
      });
    });
  }
}

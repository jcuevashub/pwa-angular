import { PaymentService } from './../../services/payment.service';
import { Component, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})

export class PaymentComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('cardInfo') cardInfo: ElementRef;
  amount: number = 500;
  card: any;
  cardHandler = this.onChange.bind(this);
  cardError: string;
  currentUser: string;
  currency: string = 'usd';
  customerData: any;
  cardholderName: string = 'Jackson Cuevas';

  constructor(private cd: ChangeDetectorRef, private NgZone: NgZone, private paymentService: PaymentService, private firebase: AngularFirestore, public afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe((auth) => {
      if(auth) this.currentUser = auth.uid;
      console.log(this.currentUser);
    });

   }
   ngOnInit(){
    //this.getAllPaymentMethods();
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
        console.log(error.message);
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

async onClick() {
  //await this.addNewCard();

  const { token, error } = await stripe.createToken(this.card);
  if (error) {
    console.log('Something is wrong:', error);
  } else {
    console.log('Success!', token);
    const data = {
      payment_methods: {
        card: this.card,
        billing_details: {
          name: this.cardholderName,
        },},
      currency: 'usd',
      amount: this.amount,
      status: 'new',
    }

    await this.firebase
    .firestore
    .collection('customers')
    .doc(this.currentUser)
    .collection('payments')
    .add(data);
  }
}



// Format amount for Stripe
// formatAmountForStripe(amount, currency) {
//   return this.zeroDecimalCurrency(amount, currency)
//     ? amount
//     : Math.round(amount * 100);
// }

// zeroDecimalCurrency(amount, currency) {
//   let numberFormat = new Intl.NumberFormat(['en-US'], {
//     style: 'currency',
//     currency: currency,
//     currencyDisplay: 'symbol',
//   });
//   const parts = numberFormat.formatToParts(amount);
//   let zeroDecimalCurrency = true;
//   for (let part of parts) {
//     if (part.type === 'decimal') {
//       zeroDecimalCurrency = false;
//     }
//   }
//   return zeroDecimalCurrency;
// }

  // getAllPaymentMethods() {
  //   this.firebase
  //   .firestore
  //   .collection('customers')
  //   .doc(this.currentUser)
  //   .collection("payment_methods")
  //   .onSnapshot((snapshot) => {
  //       snapshot.forEach(function (doc) {
  //         const paymentMethod = doc.data();
  //         if (!paymentMethod.card) {
  //           return;
  //         }

  //         const optionId = `card-${doc.id}`;
  //         let optionElement = document.getElementById(optionId);

  //         // Add a new option if one doesn't exist yet.
  //         if (!optionElement) {
  //           optionElement = document.createElement('option');
  //           optionElement.id = optionId;
  //           document
  //             .querySelector('select[name=payment-method]')
  //             .appendChild(optionElement);
  //         }

  //         //optionElement.value = paymentMethod.id;
  //         //optionElement.text = `${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`;
  //       });
  //   });

  // }

  // Format amount for diplay in the UI
// formatAmount(amount, currency) {
//   amount = this.zeroDecimalCurrency(amount, currency)
//     ? amount
//     : (amount / 100).toFixed(2);
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency,
//   }).format(amount);
// }

// Check if we have a zero decimal currency
// https://stripe.com/docs/currencies#zero-decimal
// zeroDecimalCurrency(amount, currency) {
//   let numberFormat = new Intl.NumberFormat(['en-US'], {
//     style: 'currency',
//     currency: currency,
//     currencyDisplay: 'symbol',
//   });
//   const parts = numberFormat.formatToParts(amount);
//   let zeroDecimalCurrency = true;
//   for (let part of parts) {
//     if (part.type === 'decimal') {
//       zeroDecimalCurrency = false;
//     }
//   }
//   return zeroDecimalCurrency;
// }
// Handle card actions like 3D Secure
// async handleCardAction(payment, docId) {
//   const { error, paymentIntent } = await stripe.handleCardAction(
//     payment.client_secret
//   );
//   if (error) {
//     alert(error.message);
//     payment = error.payment_intent;
//   } else if (paymentIntent) {
//     payment = paymentIntent;
//   }

//   await this.firebase
//     .firestore
//     .collection('stripe_customers')
//     .doc(this.currentUser)
//     .collection('payments')
//     .doc(docId)
//     .set(payment, { merge: true });
// }



}

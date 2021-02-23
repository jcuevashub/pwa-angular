import { PaymentService } from './../../services/payment.service';
import { Component, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})

export class PaymentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardInfo') cardInfo: ElementRef;
  amount: number = 5.00;
  card: any;
  cardHandler = this.onChange.bind(this);
  cardError: string;
  currentUser: any;
  currency: string = 'usd';
  customerData: any;
  cardholderName: string = 'Jackson Cuevas';

  constructor(private cd: ChangeDetectorRef, private NgZone: NgZone, private paymentService: PaymentService, private firebase: AngularFirestore, public afAuth: AngularFireAuth) {
    this.afAuth.authState.subscribe((auth) => {
      if(auth) this.currentUser = auth;
      console.log(this.currentUser);
    });

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

  const customer = await stripe.customers.create({ email: this.currentUser.email,
    phone: this.currentUser.phoneNumber,
    name: this.currentUser.displayName});

    const intent = await stripe.setupIntents.create({
      customer: customer.id,
    });

    await this.firebase.firestore.collection('customers').doc(this.currentUser).set({
      customer_id: customer.id,
      setup_secret: intent.client_secret,
    });

    await this.firebase.firestore.collection('users').doc(this.currentUser.uid).set({
      email: this.currentUser.email,
      phone: this.currentUser.phoneNumber,
      name: this.currentUser.displayName
    })


  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customer.id,
    setup_future_usage: 'off_session',
    amount: this.amount,
    currency: "usd"
  });

  if (paymentIntent.status === "succeeded") {
    console.log("✅ Successfully charged card off session");
  }
    const data = {
      customer: 'cus_IygT3PVCZRup49',
      payment_method: 'pm_1IMklFLjeFJCOWeVSIhPHxGr',
      currency: 'usd',
      amount: this.amount,
      status: 'new',
      capture_method: 'manual'
    }

    fetch("/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    await this.firebase
    .firestore
    .collection('customers')
    .doc(this.currentUser)
    .collection('payments')
    .add(data);
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

// // Format amount for diplay in the UI
// formatAmount(amount, currency) {
//   amount = this.zeroDecimalCurrency(amount, currency)
//     ? amount
//     : (amount / 100).toFixed(2);
//   return new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency,
//   }).format(amount);
// }

//Handle card actions like 3D Secure
async handleCardAction(payment, docId) {
  const { error, paymentIntent } = await stripe.handleCardAction(
    payment.client_secret
  );
  if (error) {
    alert(error.message);
    payment = error.payment_intent;
  } else if (paymentIntent) {
    payment = paymentIntent;
  }

  await this.firebase
    .firestore
    .collection('stripe_customers')
    .doc(this.currentUser)
    .collection('payments')
    .doc(docId)
    .set(payment, { merge: true });
}
}

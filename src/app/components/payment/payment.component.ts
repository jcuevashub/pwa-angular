import { PaymentService } from './../../services/payment.service';
import { Component, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { StripeService } from 'src/app/services/stripe.service';
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
  customerId: string;

  purchase = {
    items: [{ id: "xl-tshirt" }],
    customer: 'jackson.cuevas@hotmail.com'

  };

  constructor(private cd: ChangeDetectorRef, private NgZone: NgZone, private paymentService: PaymentService, private firebase: AngularFirestore, public afAuth: AngularFireAuth, public stripeService: StripeService) {
    this.afAuth.authState.subscribe((auth) => {
      if(auth) this.currentUser = auth;
      console.log(this.currentUser);
    });

   }

  ngAfterViewInit() {
    // const style = {
    //   base: {
    //     color: "#32325d",
    //     fontFamily: 'Arial, sans-serif',
    //     fontSmoothing: "antialiased",
    //     fontSize: "16px",
    //     "::placeholder": {
    //       color: "#32325d"
    //     }
    //   },
    //   invalid: {
    //     fontFamily: 'Arial, sans-serif',
    //     color: "#fa755a",
    //     iconColor: "#fa755a"
    //   }
    // };

    // this.card = elements.create('card',{hidePostalCode: true, style});
    // this.card.mount(this.cardInfo.nativeElement);
    // this.card.on("change", function (event) {
    //   // Disable the Pay button if there are no card details in the Element
    //   document.querySelector("button").disabled = event.empty;
    //   document.querySelector("#card-error").textContent = event.error ? event.error.message : "";
    // });
    // this.card.addEventListener('change', this.cardHandler);
    this.stripeService.createPaymentIntent(this.purchase).then((data) => {
      var elements = stripe.elements();

      var style = {
        base: {
          color: "#32325d",
          fontFamily: 'Arial, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#32325d"
          }
        },
        invalid: {
          fontFamily: 'Arial, sans-serif',
          color: "#fa755a",
          iconColor: "#fa755a"
        }
      };

      this.card  = elements.create("card", { style: style });
      this.card.mount(this.cardInfo.nativeElement);
      this.customerData = data;
    }).catch((error => {
      console.log(error);
    }));
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

  // async addNewCard() {

  //   const doc = await this.firebase
  //                     .firestore
  //                     .collection('customers')
  //                     .doc(this.currentUser)
  //                     .get();

  //   if (!doc.exists) {
  //     console.log('No such document!');
  //   } else {
  //     this.firebase.firestore
  //     .collection('customers')
  //     .doc(this.currentUser)
  //     .collection('payment_methods')

  //     const {setupIntent, error} = await stripe.confirmCardSetup(
  //       doc.data().setup_secret,
  //       {
  //         payment_method: {
  //           card: this.card,
  //           billing_details: {
  //             name: this.cardholderName,
  //           },
  //         },
  //       },
  //     );

  //     if(error) {
  //       console.log("UN ERROR:"+error);
  //     }

  //     await this.firebase
  //     .firestore
  //     .collection('customers')
  //     .doc(this.currentUser)
  //     .collection('payment_methods')
  //     .add({ id: setupIntent.payment_method});    }

  // }

  // async getAllPaymentMethods() {
  //   await this.firebase
  //   .firestore
  //   .collection('customers')
  //   .doc(this.currentUser)
  //   .collection("payment_methods").get()
  //   .then(snapshot => {
  //     snapshot.forEach(doc => {
  //       const paymentMethod = doc.data().card;
  //       if (!paymentMethod.card) {
  //         return;
  //       }
  //       const optionId = `card-${doc.id}`;
  //       const paymentValue = paymentMethod.id;
  //       console.log(paymentValue);
  //       console.log(`${paymentMethod.card.brand} •••• ${paymentMethod.card.last4} | Expires ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
  //     });
  //   });
  // }

async onClick() {
console.log(this.customerData);
stripe.confirmCardPayment(this.customerData.clientSecret, {
      receipt_email: 'jackson.cuevas@hotmail.com',
      payment_method: {
        card: this.card
      }
    })
    .then(function(result) {
      if (result.error) {
        console.log(result.error.message);
        // Show error to your customer
        //showError(result.error.message);
      } else {
        console.log("SUCCESS");
        // The payment succeeded!
        //orderComplete(result.paymentIntent.id);
      }
    });
    // const data = {
    //   customer: 'cus_IygT3PVCZRup49',
    //   payment_method: 'pm_1IMklFLjeFJCOWeVSIhPHxGr',
    //   currency: 'usd',
    //   amount: this.amount,
    //   status: 'new',
    //   capture_method: 'manual'
    // }

    // fetch("/create-payment-intent", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify(data)
    // })

    // await this.firebase
    // .firestore
    // .collection('customers')
    // .doc(this.currentUser)
    // .collection('payments')
    // .add(data);
}



set orderComplete(paymentIntentId) {
  //loading(false);
  document
    .querySelector(".result-message a")
    .setAttribute(
      "href",
      "https://dashboard.stripe.com/test/payments/" + paymentIntentId
    );
  document.querySelector(".result-message").classList.remove("hidden");
  document.querySelector("button").disabled = true;
};

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

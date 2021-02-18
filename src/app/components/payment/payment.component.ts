import { PaymentService } from './../../services/payment.service';
import { Component, ChangeDetectorRef, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})

export class PaymentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardInfo') cardInfo: ElementRef;
  amount: number = 500;
  card: any;
  cardHandler = this.onChange.bind(this);
  cardError: string;

  constructor(private cd: ChangeDetectorRef,private NgZone: NgZone, private paymentService: PaymentService) { }

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
  const { token, error } = await stripe.createToken(this.card);
  if (error) {
    console.log('Something is wrong:', error);
  } else {
    console.log('Success!', token);
    this.paymentService.processPayment(token,this.amount);
  }
}
}

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-subcription',
  templateUrl: './subcription.component.html',
  styleUrls: ['./subcription.component.css']
})
export class SubcriptionComponent implements OnInit {
  plan: string;

  constructor() { }

  ngOnInit() {
  }

  async checkout() {
    const { error } = await stripe.redirectToCheckout({
      mode: 'payment',
      lineItems: [{ price: 'pro', quantity: 3 }],
      successUrl: `${window.location.href}/success`,
      cancelUrl: `${window.location.href}/failure`,
    });
  }

}

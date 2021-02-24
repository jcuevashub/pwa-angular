import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const baseUrl = 'http://localhost:4242';

@Injectable({
  providedIn: 'root'
})
export class StripeService {

constructor(private http: HttpClient) { }

private async request(method: string, url: string, data?: any) {
  const result = this.http.request(method, url, {
    body: JSON.stringify(data),
    responseType: 'json',
    observe: 'body',
    headers: {
      "Content-Type": "application/json"
    }
  });
  return new Promise<any>((resolve, reject) => {
    result.subscribe(resolve as any, reject as any);
  });
}

  createPaymentIntent(purchase) {
    return this.request('post', `${baseUrl}/create-payment-intent`, purchase);
  }

}



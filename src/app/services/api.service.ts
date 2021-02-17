import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResponseData{
  name: string;
  description: string;
  url: string;
  html: string;
  markdown: string;
}  

@Injectable({
  providedIn: 'root'
})

export class ApiService {
private baseUrl = 'https://www.techiediaries.com/api/data.json';
constructor(private httClient: HttpClient){}

fetch(): Observable<ResponseData[]> {
  return this.httClient.get(this.baseUrl) as Observable<ResponseData[]>;
}
  
}

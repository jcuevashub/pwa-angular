import { Component, HostListener, OnInit } from '@angular/core';
import { ResponseData, ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'pwa-angular';
  responses: Array<ResponseData>;
  deferredPrompt: any;
  showButton = false;

  @HostListener('window:beforeinstallprompt', ['$event'])

  onbeforeinstallprompt(e) {
    console.log("Holaaa", e);
    //Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    //Stash the event so it can be triggered later.
    this.deferredPrompt = e;
    this.showButton = true;
  }

  constructor(private apiService: ApiService){}
  ngOnInit():void {
    this.fetchData();
  }

  addToHomeScreen() {

    //hide our user interface tha shows our A2HS button
    this.showButton = false;
    //Show the promt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice
    .then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      }else {
        console.log('User dismissed the A2HS prompt');
      }
      this.deferredPrompt = null;
    });
  }

  fetchData() {
    this.apiService.fetch().subscribe(
      (data: Array<ResponseData>) => {
      console.log(data);
      this.responses = data;
    },(err) => {
      console.log(err);
    }
    );
  }

}

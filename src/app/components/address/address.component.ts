import { EventEmitter, ViewChild,Component, Input, OnInit, Output } from '@angular/core';
import { } from 'googlemaps';
@Component({
  selector: 'app-address',
  template: `
      <input class="input"
        type="text"
        (ngModel)="autocompleteInput"
        #addresstext style="padding: 12px 20px; border: 1px solid #ccc; width: 400px"
        >
    `,
})
export class AddressComponent implements OnInit {
  @Input() adressType: string;
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext') addresstext: any;
  autocompleteInput: string;
  queryWait: boolean;
  map: google.maps.Map;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.getPlaceAutocomplete();
  }

  private getPlaceAutocomplete() {
    const autocomplete = new google.maps.places.Autocomplete(this.addresstext.nativeElement,{
      componentRestrictions: { country: 'US'},
      types: [this.adressType]
    });
    google.maps.event.addListener(autocomplete, 'place_change', () => {
      const place = autocomplete.getPlace();
      this.invokeEvent(place);
    });
  }

  invokeEvent(place: Object) {
    this.setAddress.emit(place);
  }

}

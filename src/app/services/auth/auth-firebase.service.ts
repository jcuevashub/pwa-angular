import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthFirebaseService {

  user: Observable<firebase.default.User>;

  constructor(private firebaseAuth: AngularFireAuth) {
    this.user = this.firebaseAuth.authState;
   }

   signup(email: string, pass){
     this.firebaseAuth.createUserWithEmailAndPassword(email, pass)
     .then(value => {
      console.log('Success!', value);
     }).catch(err => {
       console.log('Someting went wrong:',err.message);
     });
   }

   login(email: string, password: string) {
     this.firebaseAuth.signInWithEmailAndPassword(email, password)
     .then(value => {
      console.log('Nice, it worked!',value);
     }).catch(err => {
      console.log('Something went wrong: ', err.message);
     });
   }

   logout() {
     this.firebaseAuth.signOut();
   }


}

import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment.staging';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotesTransmitterService {

  private apiUrl = environment.apiBaseUrl + 'health';
  private apiUrl2 = environment.apiBaseUrl + 'notes';

  constructor(private http: HttpClient) { }

  getMessage(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(catchError((error) => this.handleError(error)));
  }

  sendMessage(): Observable<any> {
    return this.http.post(this.apiUrl2, "Hello,service")
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    const errorMsg = error.error?.message || error.statusText || 'Unknown error';
    return throwError(() => new Error(errorMsg));
  }
}

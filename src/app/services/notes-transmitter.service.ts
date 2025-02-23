import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment.staging';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotesTransmitterService {

  private apiUrl = environment.apiBaseUrl + '/health';

  constructor(private http: HttpClient) { }

  getMessage(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}

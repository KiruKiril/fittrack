import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { Tagesplanung } from '../models/tagesplanung.model';

@Injectable({ providedIn: 'root' })
export class TagesplanungService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/tagesplanungen`;

  getAll(): Observable<Tagesplanung[]> {
    return this.http.get<Tagesplanung[]>(this.apiUrl);
  }

  set(datum: string, trainingId: number): Observable<Tagesplanung> {
    return this.http.put<Tagesplanung>(`${this.apiUrl}/${datum}`, { trainingId });
  }

  delete(datum: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${datum}`);
  }
}

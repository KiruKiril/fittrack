import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { Uebung } from '../models/uebung.model';

@Injectable({ providedIn: 'root' })
export class UebungService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/uebungen`;

  getAll(): Observable<Uebung[]> {
    return this.http.get<Uebung[]>(this.apiUrl);
  }

  create(uebung: Uebung): Observable<Uebung> {
    return this.http.post<Uebung>(this.apiUrl, uebung);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

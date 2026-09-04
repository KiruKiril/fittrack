import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { Training } from '../models/training.model';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/trainings`;

  getAll(): Observable<Training[]> {
    return this.http.get<Training[]>(this.apiUrl);
  }

  getOne(id: number): Observable<Training> {
    return this.http.get<Training>(`${this.apiUrl}/${id}`);
  }

  create(training: Training): Observable<Training> {
    return this.http.post<Training>(this.apiUrl, training);
  }

  update(id: number, training: Training): Observable<Training> {
    return this.http.put<Training>(`${this.apiUrl}/${id}`, training);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getBibliothek(): Observable<Training[]> {
    return this.http.get<Training[]>(`${this.apiUrl}/bibliothek`);
  }

  addFromBibliothek(id: number): Observable<Training> {
    return this.http.post<Training>(`${this.apiUrl}/bibliothek/${id}`, {});
  }
}

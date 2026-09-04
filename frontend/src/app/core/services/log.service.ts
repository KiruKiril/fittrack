import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { TrainingAusfuehrung } from '../models/log.model';

@Injectable({ providedIn: 'root' })
export class LogService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/training-ausfuehrungen`;

  getAll(): Observable<TrainingAusfuehrung[]> {
    return this.http.get<TrainingAusfuehrung[]>(this.apiUrl);
  }

  getOne(id: number): Observable<TrainingAusfuehrung> {
    return this.http.get<TrainingAusfuehrung>(`${this.apiUrl}/${id}`);
  }

  create(log: TrainingAusfuehrung): Observable<TrainingAusfuehrung> {
    return this.http.post<TrainingAusfuehrung>(this.apiUrl, log);
  }

  update(id: number, log: TrainingAusfuehrung): Observable<TrainingAusfuehrung> {
    return this.http.put<TrainingAusfuehrung>(`${this.apiUrl}/${id}`, log);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

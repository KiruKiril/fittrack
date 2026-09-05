import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { Split } from '../models/split.model';

@Injectable({ providedIn: 'root' })
export class SplitService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/splits`;

  getAll(): Observable<Split[]> {
    return this.http.get<Split[]>(this.apiUrl);
  }

  getOne(id: number): Observable<Split> {
    return this.http.get<Split>(`${this.apiUrl}/${id}`);
  }

  create(split: Split): Observable<Split> {
    return this.http.post<Split>(this.apiUrl, split);
  }

  update(id: number, split: Split): Observable<Split> {
    return this.http.put<Split>(`${this.apiUrl}/${id}`, split);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  advance(id: number): Observable<Split> {
    return this.http.post<Split>(`${this.apiUrl}/${id}/weiter`, {});
  }

  getBibliothek(): Observable<Split[]> {
    return this.http.get<Split[]>(`${this.apiUrl}/bibliothek`);
  }

  addFromBibliothek(id: number): Observable<Split> {
    return this.http.post<Split>(`${this.apiUrl}/bibliothek/${id}`, {});
  }
}

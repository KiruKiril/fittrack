import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  setNext(id: number, splitTrainingId: number): Observable<Split> {
    return this.http.put<Split>(`${this.apiUrl}/${id}/naechstes/${splitTrainingId}`, {});
  }

  activate(id: number): Observable<Split> {
    return this.http.post<Split>(`${this.apiUrl}/${id}/aktivieren`, {});
  }

  deactivate(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/deaktivieren`, {});
  }

  getActive(): Observable<Split | null> {
    return this.http.get<Split>(`${this.apiUrl}/aktiv`, { observe: 'response' }).pipe(
      map((res) => (res.status === 204 ? null : res.body))
    );
  }

  getBibliothek(): Observable<Split[]> {
    return this.http.get<Split[]>(`${this.apiUrl}/bibliothek`);
  }

  addFromBibliothek(id: number): Observable<Split> {
    return this.http.post<Split>(`${this.apiUrl}/bibliothek/${id}`, {});
  }
}

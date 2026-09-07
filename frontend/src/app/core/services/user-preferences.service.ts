import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { UserPreferences } from '../models/user-preferences.model';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE}/user/praeferenzen`;

  get(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.apiUrl);
  }

  update(planungshorizontWochen: number): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(this.apiUrl, { planungshorizontWochen });
  }
}

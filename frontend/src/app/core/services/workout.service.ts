import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exercise {
  id?: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Workout {
  id?: number;
  name: string;
  description: string;
  createdAt?: string;
  exercises: Exercise[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  private apiUrl = 'http://localhost:8080/api/workouts';

  constructor(private http: HttpClient) {}

  getWorkouts(): Observable<Workout[]> {
    return this.http.get<Workout[]>(this.apiUrl);
  }

  createWorkout(workout: Workout): Observable<Workout> {
    return this.http.post<Workout>(this.apiUrl, workout);
  }

  deleteWorkout(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

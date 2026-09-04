import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // /api/auth/** ist oeffentlich - ein evtl. gespeichertes (z.B. abgelaufenes) Token darf
  // Login/Registrieren nicht blockieren, daher hier nie mitschicken.
  const isAuthEndpoint = req.url.includes('/api/auth/');
  const token = isAuthEndpoint ? null : authService.getToken();

  const authedReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
        // Token ist ungueltig/abgelaufen - Session aufraeumen statt den User mit einer
        // dauerhaft kaputten Session haengen zu lassen.
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};

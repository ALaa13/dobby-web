import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let modifiedReq = req;

  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Session expired or unauthorized. Logging out...');
        authService.logout();
        inject(UserService).clearUser();

        // Handle the routing promise natively without blocking the observable stream return
        router.navigate(['/login']).then(() => {
          console.log('Redirected to login screen successfully.');
        });
      }
      return throwError(() => error);
    }),
  );
};

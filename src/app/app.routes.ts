import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { AuthService } from './service/auth/auth.service';
import { inject } from '@angular/core';
import { LogComponent } from './component/log/log.component';
import { RoastComponent } from './component/roast/roast.component';
import { FactComponent } from './component/fact/fact.component';

// Guard for Public Pages (LoginComponent)
const guestGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const url = router.url;

  if (url === '/log') {
    return true;
  }

  if (authService.isAuthenticated()) {
    await router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

// Define the inline guard logic using Auth/isAuthenticated helper
const authGuard = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasLocalToken = authService.isAuthenticated();
  const hasUrlToken = !!route.queryParams['token'];

  if (hasLocalToken || hasUrlToken) {
    return true;
  } else {
    await router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'log', component: LogComponent, canActivate: [authGuard] },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'facts', pathMatch: 'full' },
      { path: 'facts', component: FactComponent },
      { path: 'roasts', component: RoastComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { BotConfig } from './component/bot-config/bot-config';
import { AuthService } from './service/auth/auth.service';
import { inject } from '@angular/core';

// Guard for Public Pages (LoginComponent)
const guestGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

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

  // If either is true, let them pass!
  if (hasLocalToken || hasUrlToken) {
    return true;
  } else {
    // No token anywhere, kick them to login
    await router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [{ path: '', component: BotConfig }],
  },
  { path: '**', redirectTo: 'login' },
];

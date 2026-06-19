import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'dobby_auth_token';
  public authState$ = new BehaviorSubject<boolean>(this.isAuthenticated());

  constructor(
    private router: Router,
    private zone: NgZone,
  ) {
    this.listenForExternalLogout();
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  private listenForExternalLogout() {
    window.addEventListener('storage', (event) => {
      // If another tab deleted the token or explicitly fired the logout-event
      if (event.key === 'logout-event' || (event.key === this.TOKEN_KEY && !event.newValue)) {
        this.zone.run(() => {
          console.warn('🛑 Global Auth: Logout detected from another tab!');
          this.executeGlobalLogoutCleanup();
        });
      }
      // If another tab deleted the token or explicitly fired the login-event
      if (event.key === this.TOKEN_KEY && event.newValue) {
        this.zone.run(() => {
          console.log('✨ Global Auth: Login detected from another tab!');
          this.authState$.next(true);
          this.router.navigate(['/dashboard']).then(); // Teleports the stale tab straight to the dashboard!
        });
      }
    });
  }

  private executeGlobalLogoutCleanup() {
    this.authState$.next(false);
    // Boot to the login screen globally
    this.router.navigate(['/login']).then();
  }
}

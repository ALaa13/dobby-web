import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { DiscordAdminProfile } from '../../types/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userUrlEndPoint = new URL('users/me', environment.backendUrl).toString();
  // Update the signal to hold the full dashboard profile layout reactively
  currentUser = signal<DiscordAdminProfile | null>(null);

  constructor(private http: HttpClient) {}

  // Fetch complete profile + servers from backend and save it in our signal state
  fetchProfile(): Observable<DiscordAdminProfile> {
    return this.http.get<DiscordAdminProfile>(this.userUrlEndPoint).pipe(
      tap((profile) => {
        this.currentUser.set(profile);
      }),
    );
  }

  clearUser(): void {
    this.currentUser.set(null);
  }
}

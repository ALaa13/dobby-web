import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface UserProfile {
  discord_user_id: string;
  display_name: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userUrlEndPoint = new URL('users/me', environment.backendUrl).toString();

  // Define a reactive state signal to hold our user profile data globally
  currentUser = signal<UserProfile | null>(null);

  constructor(private http: HttpClient) {}

  // Fetch profile from backend and save it in our signal state
  fetchProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.userUrlEndPoint).pipe(
      tap((profile) => {
        this.currentUser.set(profile);
      }),
    );
  }

  clearUser(): void {
    this.currentUser.set(null);
  }
}

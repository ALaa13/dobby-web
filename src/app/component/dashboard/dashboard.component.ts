import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { UserService } from '../../service/user/user.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterOutlet, NgOptimizedImage],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // Using modern inject syntax to keep code uniform
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  protected userService = inject(UserService);
  private tokenHandled = false;
  isSidebarOpen = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(async () => {
      const token = this.route.snapshot.queryParams['token'];

      if (token) {
        this.tokenHandled = true;
        this.authService.setToken(token);

        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { token: null },
          queryParamsHandling: 'merge',
        });

        // Load the profile right after securing the new token
        this.loadUserProfile();
        return;
      }
      if (!this.tokenHandled && this.authService.isAuthenticated()) {
        // If they just navigated straight here and are already logged in, load profile
        this.loadUserProfile();
      }
    });
  }

  private loadUserProfile(): void {
    this.userService.fetchProfile().subscribe({
      next: (data) => console.log('Profile loaded'),
      error: (err) => console.error('Could not retrieve user profile tracking data', err),
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.userService.clearUser();
  }
}

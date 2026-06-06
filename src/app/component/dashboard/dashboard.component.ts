import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { UserService } from '../../service/user/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // Using modern inject syntax to keep code uniform
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  protected userService = inject(UserService); // marked protected so template can read it

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const token = params['token'];

      if (token) {
        this.authService.setToken(token);

        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { token: null },
          queryParamsHandling: 'merge',
        });

        // Load the profile right after securing the new token
        this.loadUserProfile();
      } else if (this.authService.isAuthenticated()) {
        // If they just navigated straight here and are already logged in, load profile
        this.loadUserProfile();
      }
    });
  }

  private loadUserProfile(): void {
    this.userService.fetchProfile().subscribe({
      next: (data) => console.log('Profile loaded for:', data.display_name),
      error: (err) => console.error('Could not retrieve user profile tracking data', err),
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.userService.clearUser();
  }
}

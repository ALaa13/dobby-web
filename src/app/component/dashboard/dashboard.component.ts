import { Component, inject, OnInit, signal } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { UserService } from '../../service/user/user.service';
import { NgOptimizedImage } from '@angular/common';
import { DashboardStateService } from '../../service/dashboard/dashboard-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgOptimizedImage],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  protected userService = inject(UserService);
  protected stateService = inject(DashboardStateService);

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

        this.loadUserProfile();
        return;
      }
      if (!this.tokenHandled && this.authService.isAuthenticated()) {
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

import { Component } from '@angular/core';
import { environment } from '@env/environment';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly backendAuthEndPoint = new URL('auth/login', environment.backendUrl).toString();
}

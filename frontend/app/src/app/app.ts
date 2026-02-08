/**
 * Root Application Component
 * Main component that serves as the application shell
 */

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'dil-ogrenme-app';
}
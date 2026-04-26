import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--bg); }
    .main-content { padding-top: 4.5rem; }
  `],
})
export class AppComponent {}

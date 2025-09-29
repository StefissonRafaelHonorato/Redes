import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopMenuComponent } from './components/top-menu/top-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend-drill-down');
}

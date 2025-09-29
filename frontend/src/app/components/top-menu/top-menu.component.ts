import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'top-menu',
    standalone: true,
    imports: [CommonModule, MenuModule, ButtonModule],
    template: `
    <div class="top-menu p-3 shadow-lg flex items-center gap-3">
      <p-menu #mlMenu [model]="mlMenuItems"></p-menu>
    </div>
  `
})
export class TopMenuComponent {
    mlMenuItems: { label: string; icon: string; command: () => Promise<boolean>; }[] | undefined;

    constructor(private router: Router) { }

    ngOnInit() {
        this.mlMenuItems = [
            {
                label: 'Previsões de Tráfego',
                icon: 'pi pi-fw pi-chart-line',
                command: () => this.router.navigate(['/ml'])
            },
            {
                label: 'Capturas Placa de Rede',
                icon: 'pi pi-fw pi-chart-line',
                command: () => this.router.navigate(['/chart'])
            }
        ];
    }
}

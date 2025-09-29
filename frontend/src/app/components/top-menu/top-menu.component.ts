import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar'

@Component({
    selector: 'top-menu',
    standalone: true,
    imports: [CommonModule, MenubarModule, ButtonModule, AvatarModule],
    templateUrl: './top-menu.component.html',
    styleUrls: ['./top-menu.component.css']
})
export class TopMenuComponent {
    mlMenuItems: { label: string; icon: string; command: () => Promise<boolean>; }[] | undefined;

    constructor(private router: Router) { }

    ngOnInit() {
        this.mlMenuItems = [
            {
                label: 'Capturas Placa de Rede',
                icon: 'pi pi-fw pi-chart-line',
                command: () => this.router.navigate(['/chart'])
            }
        ];
    }
}

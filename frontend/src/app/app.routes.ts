import { Routes } from '@angular/router';
import { TrafficChartComponent } from './components/traffic-chart/traffic-chart.component';

export const routes: Routes = [
    { path: '', redirectTo: 'chart', pathMatch: 'full' },
    { path: 'chart', component: TrafficChartComponent },
    { path: '**', redirectTo: 'chart' }
];

import { Routes } from '@angular/router';
import { TrafficChartComponent } from './components/traffic-chart/traffic-chart.component';
import { MlPredictionsComponent } from './components/ml-predictions/ml-predictions.component';

export const routes: Routes = [
    { path: '', redirectTo: 'chart', pathMatch: 'full' },
    { path: 'chart', component: TrafficChartComponent },
    { path: 'ml', component: MlPredictionsComponent },
    { path: '**', redirectTo: 'chart' }
];

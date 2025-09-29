import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ml-predictions',
    standalone: true,
    imports: [CommonModule],
    template: `
    <h2>Previsões de Tráfego</h2>
    <p>Aqui você vai mostrar os gráficos/resultados do Machine Learning</p>
  `
})
export class MlPredictionsComponent { }

import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, effect, signal, inject } from '@angular/core';
import { Chart, ChartConfiguration, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js/auto';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// --- IMPORTAÇÕES DO SEU PROJETO ---
// (Estes imports assumem que o seu serviço e modelos estão disponíveis para o componente)
import { TrafficService } from '../../services/traffic.service';
import { TrafficItem } from '../../models/traffic.model';

// --- COMPONENTE ATUALIZADO ---

@Component({
    selector: 'app-traffic-chart', // Seletor original restaurado
    standalone: true,
    template: `
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4 font-sans">
      <div class="w-full max-w-4xl h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <!-- O canvas agora tem uma referência de template #trafficChart -->
        <canvas #trafficChart></canvas>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      font-family: 'Inter', sans-serif;
    }
  `],
    // O 'providers' foi removido, pois o TrafficService é 'providedIn: "root"'
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficChartComponent implements AfterViewInit, OnDestroy {
    // 1. Acessando o Canvas de forma segura com @ViewChild
    @ViewChild('trafficChart')
    private canvasRef!: ElementRef<HTMLCanvasElement>;

    // 2. Injetando o seu TrafficService real
    private trafficService = inject(TrafficService);
    private dataSubscription?: Subscription;

    // 3. Usando Signals para gerenciamento de estado reativo
    private chart = signal<Chart | undefined>(undefined);
    private trafficData = signal<TrafficItem[]>([]);

    constructor() {
        // 4. Usando 'effect' para reagir a mudanças nos sinais
        effect(() => {
            const currentChart = this.chart();
            const data = this.trafficData();

            if (currentChart && data.length > 0) {
                this.updateChart(currentChart, data);
            }
        });
    }

    ngAfterViewInit(): void {
        Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);
        this.initChart();
        this.startDataLoading();
    }

    ngOnDestroy(): void {
        // 5. Limpando a subscrição para evitar vazamentos de memória
        this.dataSubscription?.unsubscribe();
        this.chart()?.destroy();
    }

    private initChart(): void {
        const ctx = this.canvasRef.nativeElement;
        if (!ctx) return;

        const chartConfig: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Tráfego de Entrada (bytes)',
                        data: [],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Tráfego de Saída (bytes)',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(20, 20, 20, 0.8)', // Cor do texto ajustada para temas claros/escuros
                        }
                    },
                    title: {
                        display: true,
                        text: 'Volume de Tráfego por Cliente IP (Atualizado a cada 5s)',
                        color: 'rgba(10, 10, 10, 0.9)', // Cor do texto ajustada
                        font: { size: 18 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                        },
                        ticks: {
                            color: 'rgba(20, 20, 20, 0.8)',
                            callback: (value) => {
                                const numericValue = Number(value);
                                if (numericValue >= 1000000) return (numericValue / 1000000).toFixed(1) + ' MB';
                                if (numericValue >= 1000) return (numericValue / 1000).toFixed(1) + ' KB';
                                return numericValue + ' B';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: 'rgba(20, 20, 20, 0.8)',
                        }
                    }
                }
            }
        };
        this.chart.set(new Chart(ctx, chartConfig));
    }

    private startDataLoading(): void {
        this.dataSubscription = this.trafficService.getTraffic()
            .subscribe({
                next: (response) => {
                    if (response.traffic) {
                        this.trafficData.set(response.traffic);
                    }
                },
                error: (err) => console.error('Erro no WebSocket:', err)
            });
    }

    private updateChart(chart: Chart, data: TrafficItem[]): void {
        chart.data.labels = data.map(item => item.client_ip);
        chart.data.datasets[0].data = data.map(item => item.inbound);
        chart.data.datasets[1].data = data.map(item => item.outbound);
        chart.update('none');
    }
}
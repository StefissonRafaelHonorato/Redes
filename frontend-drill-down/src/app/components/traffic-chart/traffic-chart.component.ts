import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, effect, signal, inject } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { TrafficService } from '../../services/traffic.service';
import { TrafficItem } from '../../models/traffic.model';
import { NgClass } from '@angular/common';

type Period = 'minute' | 'hour' | 'day' | 'week';
type ViewMode = Period | 'live';

@Component({
    selector: 'app-traffic-chart',
    standalone: true,
    imports: [NgClass],
    template: `
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen w-full flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
        <div class="w-full max-w-7xl">
            <div class="mb-6 flex flex-wrap justify-center gap-2">
                <button (click)="switchToRealtimeView()" [ngClass]="getButtonClasses('live')">Tempo Real</button>
                <button (click)="loadHistorical('minute')" [ngClass]="getButtonClasses('minute')">Último Minuto</button>
                <button (click)="loadHistorical('hour')" [ngClass]="getButtonClasses('hour')">Última Hora</button>
                <button (click)="loadHistorical('day')" [ngClass]="getButtonClasses('day')">Último Dia</button>
                <button (click)="loadHistorical('week')" [ngClass]="getButtonClasses('week')">Última Semana</button>
            </div>
            <div class="flex flex-wrap -mx-3">
                <div class="w-full lg:w-2/3 px-3 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 h-[500px]">
                        <canvas #trafficChart></canvas>
                    </div>
                </div>
                <div class="w-full lg:w-1/3 px-3 mb-6">
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 h-[500px]">
                        <canvas #protocolChart></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`:host { display: block; font-family: 'Inter', sans-serif; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficChartComponent implements AfterViewInit, OnDestroy {

    @ViewChild('trafficChart') private trafficCanvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('protocolChart') private protocolCanvasRef!: ElementRef<HTMLCanvasElement>;

    private trafficService = inject(TrafficService);

    private trafficChart = signal<Chart | undefined>(undefined);
    private protocolChart = signal<Chart | undefined>(undefined);
    private trafficData = signal<TrafficItem[]>([]);

    public activeView = signal<ViewMode>('live');

    private dataSubscription?: Subscription;
    private readonly isDarkMode = signal(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    constructor() {
        effect(() => {
            const data = this.trafficData();
            // O gráfico de protocolo mostra o consolidado dos dados recebidos
            this.updateProtocolChart(this.protocolChart(), data);
            // O gráfico de tráfego mostra apenas os Top 10 IPs para ser legível
            this.updateTrafficChart(this.trafficChart(), data);
        });

        effect(() => {
            this.updateChartColors(this.trafficChart(), this.isDarkMode());
            this.updateChartColors(this.protocolChart(), this.isDarkMode());
        });
    }

    ngAfterViewInit(): void {
        this.initTrafficChart();
        this.initProtocolChart();
        this.switchToRealtimeView(); // Carga inicial em modo tempo real

        window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.isDarkMode.set(e.matches);
        });
    }

    ngOnDestroy(): void {
        this.dataSubscription?.unsubscribe();
        this.trafficChart()?.destroy();
        this.protocolChart()?.destroy();
    }

    switchToRealtimeView(): void {
        this.activeView.set('live');
        this.dataSubscription?.unsubscribe();

        this.dataSubscription = interval(5000).pipe(
            startWith(0),
            switchMap(() => this.trafficService.getTraffic())
        ).subscribe({
            next: res => this.trafficData.set(res.traffic),
            error: err => console.error('Erro na busca em tempo real:', err)
        });
    }

    loadHistorical(period: Period): void {
        this.activeView.set(period);
        this.dataSubscription?.unsubscribe();

        this.dataSubscription = this.trafficService.getHistoricalTraffic(period).subscribe({
            next: res => this.trafficData.set(res.traffic),
            error: err => console.error('Erro ao buscar histórico:', err)
        });
    }

    getButtonClasses(view: ViewMode): string {
        const base = 'font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
        return this.activeView() === view
            ? `${base} bg-blue-600 text-white ring-blue-500`
            : `${base} bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600`;
    }

    private initTrafficChart(): void {
        const ctx = this.trafficCanvasRef.nativeElement;
        const textColor = this.isDarkMode() ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';

        const chartConfig: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels: [], datasets: [
                    { label: 'Tráfego Entrada (Inbound)', data: [], backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1, borderRadius: 5 },
                    { label: 'Tráfego Saída (Outbound)', data: [], backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1, borderRadius: 5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor } },
                    title: { display: true, text: 'Tráfego de Rede por IP', color: textColor, font: { size: 18, weight: 600 } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: this.isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }, ticks: { color: textColor, callback: v => this.formatBytes(Number(v)) } },
                    x: { grid: { color: this.isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }, ticks: { color: textColor } }
                }
            }
        };
        this.trafficChart.set(new Chart(ctx, chartConfig));
    }

    private initProtocolChart(): void {
        const ctx = this.protocolCanvasRef.nativeElement;
        const textColor = this.isDarkMode() ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';

        const chartConfig: ChartConfiguration<'doughnut'> = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tráfego por Protocolo',
                    data: [],
                    backgroundColor: ['rgba(52, 211, 153, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(99, 102, 241, 0.8)'],
                    borderColor: this.isDarkMode() ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    title: { display: true, text: 'Distribuição por Protocolo', color: textColor, font: { size: 18, weight: 600 } }
                }
            }
        };
        this.protocolChart.set(new Chart(ctx, chartConfig));
    }

    private updateTrafficChart(chart: Chart | undefined, data: TrafficItem[]): void {
        if (!chart) return;

        // Ordena os dados pelo tráfego total (in + out) e pega os 10 primeiros
        const top10Data = [...data]
            .sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound))
            .slice(0, 10);

        chart.options.plugins!.title!.text = this.activeView() === 'live'
            ? 'Top 10 IPs em Tempo Real'
            : `Top 10 IPs - ${this.activeView()}`;

        chart.data.labels = top10Data.map(item => item.client_ip);
        chart.data.datasets[0].data = top10Data.map(item => item.inbound);
        chart.data.datasets[1].data = top10Data.map(item => item.outbound);
        chart.update('none');
    }

    private updateProtocolChart(chart: Chart | undefined, data: TrafficItem[]): void {
        if (!chart) return;
        const protocolData = this.processDataForProtocolChart(data);
        chart.data.labels = Object.keys(protocolData);
        chart.data.datasets[0].data = Object.values(protocolData);
        chart.update('none');
    }

    private updateChartColors(chart: Chart | undefined, isDark: boolean): void {
        if (!chart) return;
        const textColor = isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        chart.options.plugins!.title!.color = textColor;
        chart.options.plugins!.legend!.labels!.color = textColor;

        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(axis => {
                if (axis?.ticks) axis.ticks.color = textColor;
                if (axis?.grid) axis.grid.color = gridColor;
            });
        }

        chart.update('none');
    }

    private processDataForProtocolChart(data: TrafficItem[]): { [protocol: string]: number } {
        return data.reduce((accumulator, currentItem) => {
            for (const protocolName in currentItem.protocols) {
                // Verificamos se a propriedade realmente pertence ao objeto
                if (Object.prototype.hasOwnProperty.call(currentItem.protocols, protocolName)) {
                    const trafficAmount = currentItem.protocols[protocolName];

                    // Se o protocolo já existe no nosso acumulador, somamos o valor
                    if (accumulator[protocolName]) {
                        accumulator[protocolName] += trafficAmount;
                    } else {
                        // Se não, o inicializamos com o valor atual
                        accumulator[protocolName] = trafficAmount;
                    }
                }
            }
            return accumulator;
        }, {} as { [protocol: string]: number });
    }

    private formatBytes(bytes: number, decimals = 1): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}
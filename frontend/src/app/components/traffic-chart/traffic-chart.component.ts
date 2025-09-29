import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartEvent, ActiveElement } from 'chart.js/auto';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { TrafficService } from '../../services/traffic.service';
import { TrafficItem } from '../../models/traffic.model';
import { CaptureEvent } from '../../models/traffic.model';

// --- Importações do PrimeNG ---
import { MenuItem } from 'primeng/api';
import { SpeedDialModule } from 'primeng/speeddial';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';

type Period = 'minute' | 'hour' | 'day' | 'week';
type ViewMode = Period | 'live';

@Component({
    selector: 'app-traffic-chart',
    standalone: true,
    imports: [
        CommonModule,      // Necessário para *ngIf
        SpeedDialModule,
        ButtonModule,
        CardModule,        // Módulo para o p-card
        DialogModule,      // Módulo para o p-dialog
        TableModule,       // Módulo para a tabela p-table no dialog
        TimelineModule
    ],
    templateUrl: './traffic-chart.component.html',
    styleUrls: ['./traffic-chart.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficChartComponent implements AfterViewInit, OnDestroy {

    @ViewChild('trafficChart') private trafficCanvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('protocolChart') private protocolCanvasRef!: ElementRef<HTMLCanvasElement>;

    private trafficService = inject(TrafficService);

    // Sinais para os gráficos e dados
    private trafficChart = signal<Chart | undefined>(undefined);
    private protocolChart = signal<Chart | undefined>(undefined);
    private trafficData = signal<TrafficItem[]>([]);

    // --- Sinais para o controle do Dialog ---
    public isDialogVisible = signal(false);
    public selectedIpData = signal<TrafficItem | null>(null);

    public activeView = signal<ViewMode>('live');

    private dataSubscription?: Subscription;
    private readonly isDarkMode = signal(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

    public periodActions: MenuItem[] = [
        {
            label: 'Tempo Real',
            icon: 'pi pi-bolt',
            command: () => this.switchToRealtimeView(),
            tooltip: 'Ver tráfego em tempo real'
        },
        {
            label: 'Último Minuto',
            icon: 'pi pi-clock',
            command: () => this.loadHistorical('minute'),
            tooltip: 'Filtrar por último minuto'
        },
        {
            label: 'Última Hora',
            icon: 'pi pi-hourglass',
            command: () => this.loadHistorical('hour'),
            tooltip: 'Filtrar por última hora'
        },
        {
            label: 'Último Dia',
            icon: 'pi pi-calendar',
            command: () => this.loadHistorical('day'),
            tooltip: 'Filtrar por último dia'
        },
        {
            label: 'Última Semana',
            icon: 'pi pi-calendar-times',
            command: () => this.loadHistorical('week'),
            tooltip: 'Filtrar por última semana'
        }
    ];

    constructor() {
        effect(() => {
            const data = this.trafficData();
            this.updateTrafficChart(this.trafficChart(), data);
            this.updateProtocolChart(this.protocolChart(), data);
        });

        effect(() => {
            this.updateChartColors(this.trafficChart(), this.isDarkMode());
            this.updateChartColors(this.protocolChart(), this.isDarkMode());
        });
    }

    ngAfterViewInit(): void {
        this.initTrafficChart();
        this.initProtocolChart();
        this.switchToRealtimeView();

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

    // --- Lógica do Dialog ---
    onBarClick(ip: string): void {
        const item = this.trafficData().find(i => i.client_ip === ip);
        if (!item) return;

        this.trafficService.getCapturesByIp(ip).subscribe({
            next: res => {
                const rawCaptures = Array.isArray(res) ? res : (res?.captures ?? []);
                const captures = rawCaptures.map(c => ({
                    ...c,
                    protocolList: Object.entries(c.protocols).map(([name, value]) => ({
                        name,
                        value
                    }))
                }));

                this.selectedIpData.set({ ...item, captures });
                this.isDialogVisible.set(true);
            },
            error: err => {
                console.error('Erro ao buscar histórico de capturas:', err);
                this.selectedIpData.set(item);
                this.isDialogVisible.set(true);
            }
        });
    }

    clearSelectedIp(): void {
        this.selectedIpData.set(null);
    }

    // Converte o objeto de protocolos em um array para usar na p-table
    public getProtocolsAsArray(protocols: { [key: string]: number } | undefined): { name: string, value: number }[] {
        if (!protocols) return [];
        return Object.entries(protocols)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Ordena por maior tráfego
    }

    private initTrafficChart(): void {
        const ctx = this.trafficCanvasRef.nativeElement;
        const textColor = this.isDarkMode() ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';

        const chartConfig: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Tráfego Entrada (Inbound)',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 5,
                    },
                    {
                        label: 'Tráfego Saída (Outbound)',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                        borderRadius: 5,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor } },
                    // O título foi movido para o <p-card> no template HTML
                },
                scales: {
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: { color: this.isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                        ticks: { color: textColor, callback: (v) => this.formatBytes(Number(v)) },
                    },
                    x: {
                        stacked: true,
                        grid: { color: this.isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                        ticks: { color: textColor },
                    },
                },
                onClick: (event: ChartEvent, elements: ActiveElement[]) => {
                    if (!elements.length) return;
                    const index = elements[0].index;
                    const ip = this.trafficChart()!.data.labels![index] as string;
                    this.onBarClick(ip);
                },
            },
        };
        this.trafficChart.set(new Chart(ctx, chartConfig));
    }

    private initProtocolChart(): void {
        const ctx = this.protocolCanvasRef.nativeElement;
        const textColor = this.isDarkMode() ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';

        const chartConfig: ChartConfiguration<'doughnut'> = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tráfego por Protocolo',
                    data: [],
                    backgroundColor: ['#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#3B82F6'],
                    borderColor: this.isDarkMode() ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    // O título foi movido para o <p-card> no template HTML
                }
            }
        };
        this.protocolChart.set(new Chart(ctx, chartConfig));
    }

    private updateTrafficChart(chart: Chart | undefined, data: TrafficItem[]): void {
        if (!chart) return;
        const top10Data = [...data]
            .sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound))
            .slice(0, 10);

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
        const textColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }

        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(axis => {
                if (axis?.ticks) axis.ticks.color = textColor;
                if (axis?.grid) axis.grid.color = gridColor;
            });
        }
        chart.update('none');
    }

    private processDataForProtocolChart(data: TrafficItem[]): { [protocol: string]: number } {
        return data.reduce((acc, item) => {
            for (const protocolName in item.protocols) {
                if (Object.prototype.hasOwnProperty.call(item.protocols, protocolName)) {
                    const traffic = item.protocols[protocolName];
                    acc[protocolName] = (acc[protocolName] || 0) + traffic;
                }
            }
            return acc;
        }, {} as { [protocol: string]: number });
    }

    public formatBytes(bytes: number, decimals = 2): string {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}
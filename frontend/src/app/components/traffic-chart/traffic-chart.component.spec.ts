import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TrafficChartComponent } from './traffic-chart.component';
import { TrafficService } from '../../services/traffic.service';
import { PredictionService } from '../../services/prediction.service';

// --- Mocks para os serviços ---
class MockTrafficService {
    getTraffic = jasmine.createSpy().and.returnValue(of({
        traffic: [
            { client_ip: '192.168.0.1', inbound: 100, outbound: 50, protocols: { TCP: 80, UDP: 20 } }
        ]
    }));
    getHistoricalTraffic = jasmine.createSpy().and.returnValue(of({
        traffic: [
            { client_ip: '10.0.0.5', inbound: 200, outbound: 100, protocols: { UDP: 100 } }
        ]
    }));
    getCapturesByIp = jasmine.createSpy().and.returnValue(of({ captures: [] }));
}

class MockPredictionService {
    runPrediction = jasmine.createSpy().and.returnValue(of({}));
    getPredictionByIp = jasmine.createSpy().and.returnValue(of({ prediction: 'normal', probability: 0.9 }));
}

describe('TrafficChartComponent', () => {
    let component: TrafficChartComponent;
    let fixture: ComponentFixture<TrafficChartComponent>;
    let trafficService: MockTrafficService;
    let predictionService: MockPredictionService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrafficChartComponent], // standalone component
            providers: [
                { provide: TrafficService, useClass: MockTrafficService },
                { provide: PredictionService, useClass: MockPredictionService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TrafficChartComponent);
        component = fixture.componentInstance;
        trafficService = TestBed.inject(TrafficService) as unknown as MockTrafficService;
        predictionService = TestBed.inject(PredictionService) as unknown as MockPredictionService;
        fixture.detectChanges();
    });

    // --- Testes básicos ---
    it('deve criar o componente', () => {
        expect(component).toBeTruthy();
    });

    it('deve iniciar no modo realtime e carregar tráfego', () => {
        component.switchToRealtimeView();
        expect(trafficService.getTraffic).toHaveBeenCalled();
        expect(component['trafficData']().length).toBeGreaterThan(0);
    });

    it('deve carregar histórico ao mudar período', () => {
        component.updateSelectedPeriod('hour');
        expect(trafficService.getHistoricalTraffic).toHaveBeenCalledWith('hour');
    });

    it('deve rodar predição de IP e carregar histórico do banco', () => {
        component.runPrediction('192.168.0.1');
        expect(predictionService.runPrediction).toHaveBeenCalled();
        expect(predictionService.getPredictionByIp).toHaveBeenCalledWith('192.168.0.1');
    });

    it('deve formatar bytes corretamente', () => {
        expect(component.formatBytes(1024)).toBe('1 KB');
        expect(component.formatBytes(1048576)).toBe('1 MB');
    });

    it('deve transformar protocolos em array ordenado', () => {
        const arr = component.getProtocolsAsArray({ TCP: 50, UDP: 100 });
        expect(arr[0].name).toBe('UDP');
    });

    it('deve tratar erro ao rodar predição', () => {
        predictionService.runPrediction = jasmine.createSpy().and.returnValue(throwError(() => new Error('Erro ao executar a predição')));
        component.runPrediction('10.0.0.1');
        expect(component.predictionError()).toBe('Erro ao executar a predição');
    });
});

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PredictionResponse } from '../models/prediction.model';

@Injectable({ providedIn: 'root' })
export class PredictionService {
    private http = inject(HttpClient);

    /**
     * Buscar previsões gerais (últimos N registros + próxima previsão)
     */
    getPredictions(limit = 50): Observable<PredictionResponse> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<PredictionResponse>(
            `${environment.apiUrl}/prediction`,
            { params }
        );
    }

    /**
     * Buscar previsão de um cliente específico (se você implementar no backend)
     */
    getPredictionByIp(ip: string, limit = 50): Observable<PredictionResponse> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<PredictionResponse>(
            `${environment.apiUrl}/prediction/${ip}`,
            { params }
        );
    }

    /**
     * Fazer uma previsão sob demanda via POST (se sua API suportar)
     */
    runPrediction(payload: { client_ip: string; features: any }): Observable<PredictionResponse> {
        return this.http.post<PredictionResponse>(
            `${environment.apiUrl}/prediction/run`,
            payload
        );
    }
}

import { Injectable, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TrafficItem } from '../models/traffic.model';
import { environment } from '../../environments/environment';

interface TrafficResponse {
    traffic: TrafficItem[];
}

@Injectable({ providedIn: 'root' })
export class TrafficService {

    private http = inject(HttpClient);

    constructor(private socket: Socket) { }

    // Dados em tempo real via WebSocket
    getTraffic(): Observable<TrafficResponse> {
        return this.socket.fromEvent<TrafficResponse>('traffic_update').pipe(
            tap(data => console.log('Dados WebSocket:', data))
        );
    }

    // Dados históricos via HTTP
    getHistoricalTraffic(period: 'minute' | 'hour' | 'day' | 'week'): Observable<TrafficResponse> {
        const params = new HttpParams().set('period', period);
        return this.http.get<TrafficResponse>(`${environment.apiUrl}/traffic/aggregate`, { params });
    }

    // traffic.service.ts
    getClientProtocols(ip: string): Observable<Record<string, number>> {
        return this.http.get<Record<string, number>>(
            `${environment.apiUrl}/traffic/protocols/${ip}`
        );
    }
}

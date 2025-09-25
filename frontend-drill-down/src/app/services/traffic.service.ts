import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, tap } from 'rxjs';
import { TrafficItem } from '../models/traffic.model';

interface TrafficResponse {
    traffic: TrafficItem[];
}

@Injectable({ providedIn: 'root' })
export class TrafficService {

    constructor(private socket: Socket) { }

    // Use o método fromEvent para ouvir o evento do backend
    getTraffic(): Observable<TrafficResponse> {
        return this.socket.fromEvent<TrafficResponse>('traffic_update').pipe(
            tap(data => console.log('Dados recebidos do WebSocket:', data))
        );
    }
}
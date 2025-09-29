export interface ProtocolTraffic {
    [protocol: string]: number;
}

export interface TrafficItem {
    protocols: ProtocolTraffic;
    client_ip: string;
    inbound: number;
    outbound: number;
    created_at?: string;
    captures?: CaptureEvent[];
}

export interface TrafficResponse {
    traffic: TrafficItem[];
}

export interface CaptureEvent {
    created_at: string;
    protocols?: ProtocolTraffic;
    inbound?: number;
    outbound?: number;
}
export interface ProtocolTraffic {
    [protocol: string]: number;
}

export interface TrafficItem {
    protocols: ProtocolTraffic;
    client_ip: string;
    inbound: number;
    outbound: number;
    created_at?: string;
}

export interface TrafficResponse {
    traffic: TrafficItem[];
}

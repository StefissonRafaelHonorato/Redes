export interface TrafficItem {
    client_ip: string;
    inbound: number;
    outbound: number;
}

export interface TrafficResponse {
    traffic: TrafficItem[];
}

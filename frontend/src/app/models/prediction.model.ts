// Histórico usado no treino
export interface HistoricalItem {
    inbound: number;
    outbound: number;
    timestamp: string; // ISO date
}

// Resultado da previsão
export interface PredictionItem {
    inbound: number;
    outbound: number;
    next_timestamp: string; // ISO date previsto
}

// Resposta completa da API
export interface PredictionResponse {
    historical: HistoricalItem[];
    prediction: PredictionItem;
}

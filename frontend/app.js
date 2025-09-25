const API_URL = 'http://127.0.0.1:5000/api/traffic_data';

const ctx = document.getElementById('trafficChart').getContext('2d');

const trafficChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [], // IPs dos clientes
        datasets: [{
            label: 'Tráfego de Entrada (bytes)',
            data: [], // Dados de entrada
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }, {
            label: 'Tráfego de Saída (bytes)',
            data: [], // Dados de saída
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        // Formata o eixo Y para ser mais legível (KB, MB)
                        if (value >= 1000000) return (value / 1000000).toFixed(1) + ' MB';
                        if (value >= 1000) return (value / 1000).toFixed(1) + ' KB';
                        return value + ' B';
                    }
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Volume de Tráfego por Cliente IP nos Últimos 5 Segundos'
            }
        }
    }
});

async function fetchDataAndUpdateChart() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.traffic) {
            const labels = data.traffic.map(item => item.client_ip);
            const inboundData = data.traffic.map(item => item.inbound);
            const outboundData = data.traffic.map(item => item.outbound);

            trafficChart.data.labels = labels;
            trafficChart.data.datasets[0].data = inboundData;
            trafficChart.data.datasets[1].data = outboundData;
            trafficChart.update();
        }
    } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
    }
}

fetchDataAndUpdateChart();
setInterval(fetchDataAndUpdateChart, 5000);
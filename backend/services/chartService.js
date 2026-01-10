import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 400;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

/**
 * Generate a line chart for daily data
 * @param {Array} data - Array of {day, count} objects
 * @param {String} title - Chart title
 * @param {String} label - Dataset label
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateLineChart = async (data, title, label) => {
    const labels = data.map(d => d.day);
    const values = data.map(d => d.count);

    const configuration = {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
};

/**
 * Generate charts for Direct Delivery Mode
 * @param {Object} dailySalesData 
 * @param {Object} dailyPurchasesData 
 * @returns {Promise<Object>} { salesChart, purchasesChart }
 */
export const generateDirectModeCharts = async (dailySalesData, dailyPurchasesData) => {
    const [salesChart, purchasesChart] = await Promise.all([
        generateLineChart(dailySalesData, 'Daily Sales', 'Sales Count'),
        generateLineChart(dailyPurchasesData, 'Daily Purchases', 'Purchases Count')
    ]);

    return {
        salesChart,
        purchasesChart
    };
};

/**
 * Generate charts for Order-Based Delivery Mode
 * @param {Object} dailyDeliveriesOutData 
 * @param {Object} dailyDeliveriesInData 
 * @returns {Promise<Object>} { deliveriesOutChart, deliveriesInChart }
 */
export const generateOrderModeCharts = async (dailyDeliveriesOutData, dailyDeliveriesInData) => {
    const [deliveriesOutChart, deliveriesInChart] = await Promise.all([
        generateLineChart(dailyDeliveriesOutData, 'Daily Deliveries Out', 'Deliveries Out'),
        generateLineChart(dailyDeliveriesInData, 'Daily Deliveries In', 'Deliveries In')
    ]);

    return {
        deliveriesOutChart,
        deliveriesInChart
    };
};

import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  ChartType,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
  Plugin
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { Context as DataLabelsContext } from 'chartjs-plugin-datalabels';

// Register necessary scales and controllers (Chart.js v3+)
Chart.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

// Zero Line Plugin: Draws a solid line along the zero value on the y-axis
const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart: any) {
    const { ctx, chartArea, scales } = chart;
    if (!ctx || !chartArea || !scales) return;
    const yScale = scales['y'] as LinearScale;
    const zeroY = yScale.getPixelForValue(0);
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, zeroY);
    ctx.lineTo(chartArea.right, zeroY);
    ctx.stroke();
    ctx.restore();
  }
};

const horizontalGroupSeparatorPlugin: Plugin<'bar'> = {
  id: 'horizontalGroupSeparatorPlugin',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!ctx || !scales?.['x'] || !scales?.['y']) return;

    const xScale = scales['x'];
    const yZero = scales['y'].getPixelForValue(0); // y-pixel at value 0

    ctx.save();
    ctx.strokeStyle = '#000'; // subtle gray
    ctx.lineWidth = 1;

    const ticks = xScale.ticks;

    // Draw horizontal segments between bars (skip the first)
    for (let i = 1; i < ticks.length; i++) {
      const left = xScale.getPixelForTick(i - 1);
      const right = xScale.getPixelForTick(i);

      // midpoint between ticks = space between bars
      const xMid = (left + right) / 2;

      ctx.beginPath();
      ctx.moveTo(xMid - 10, yZero + 3); // line starts a bit left
      ctx.lineTo(xMid + 10, yZero + 3); // and ends a bit right
      ctx.stroke();
    }

    ctx.restore();
  }
};



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng2-charts-playground';
  public barChartType: ChartType = 'bar';

  public chartPlugins = [ChartDataLabels,zeroLinePlugin];

  public barChartData: ChartData<'bar'> = {
    labels: [
      '1 - 5 min.', '6 - 10 min.', '11 - 15 min.', '16 - 20 min.',
      '21 - 25 min.', '26 - 30 min.', '31 - 35 min.', '36 - 40 min.',
      '41 - 45 min.', '45 min. +', '46 - 50 min.', '51 - 55 min.',
      '56 - 60 min.', '61 - 65 min.', '66 - 70 min.', '71 - 75 min.',
      '76 - 80 min.', '81 - 85 min.', '86 - 90 min.', '90 min. +'
    ],
    datasets: [
      {
        label: 'BVB',
        data: [
          2.42, 2.65, 3.10, 2.54, 2.35, 2.65, 3.10, 2.54, 2.35, 2.65,
          2.42, 2.65, 3.10, 2.54, 2.35, 2.65, 3.10, 2.54, 2.35, 2.65
        ],
        backgroundColor: '#FFD500',
        barThickness: 18,
        datalabels: {
          anchor: 'start',
          align: 'end',
          offset: 50,
          color: (context) => {
            const { dataIndex, dataset } = context as DataLabelsContext;
            const bvbValue = dataset.data[dataIndex] as number;
            const stpValue = Math.abs(context.chart.data.datasets[1].data[dataIndex] as number);
          
            return bvbValue >= stpValue ? '#1e2d36' : '#7B888E';
          },
          font: { size: 12, weight: 'bold' },
          formatter: (value: number) => value.toFixed(2)
        },
        categoryPercentage: 0.4,
        barPercentage: 0.8
      },
      {
        label: 'STP',
        base: 0,

        data: [
          -2.10, -2.32, -2.88, -2.99, -2.20, -2.10, -2.99, -2.20, -2.10, -2.88,
          -2.10, -2.32, -2.88, -2.99, -2.20, -2.10, -2.99, -2.20, -2.10, -2.88
        ],
        backgroundColor: '#4E2A1E',
        barThickness: 18,
        datalabels: {
          anchor: 'end',
          align: 'bottom',
          offset: 50,
         color: (context) => {
    const { dataIndex } = context as DataLabelsContext;
    const stpValue = Math.abs(context.chart.data.datasets[1].data[dataIndex] as number);
    const bvbValue = context.chart.data.datasets[0].data[dataIndex] as number;

    return stpValue > bvbValue ? '#1e2d36' : '#7B888E';
  },
          font: { size: 12, weight: 'bold' },
          formatter: (value: number) => Math.abs(value).toFixed(2)
        },
        categoryPercentage: 1.0,
        barPercentage: 0.8,
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: { left: 0, right: 0, top: 10, bottom: 10 }
    },
    scales: {
      x: {
        type: 'category',
        stacked: true,
        grid: { display: false },
        ticks: {
          display: true,
          color: '#7B888E',
          font: { size: 13, weight: 'bold' },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false
        },
        border: { display: false }
      },
      y: {
        type: 'linear',
        stacked: true,
        grid: { display: false },
        ticks: { display: false },
        border: { display: false },
        min: -5,
        max: 5
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: { clip: false },
      tooltip: { enabled: false },
      title: { display: false }
    }
  };
}

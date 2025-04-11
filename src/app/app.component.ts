import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Plugin
} from 'chart.js';
import ChartDataLabels, { Context as DataLabelsContext } from 'chartjs-plugin-datalabels';
import { NgFor, NgStyle } from '@angular/common';

Chart.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

export const zeroLineSegmentsPerBarPlugin: Plugin<'bar'> = {
  id: 'zeroLineSegmentsPerBarPlugin',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales, data } = chart;
    if (!ctx || !scales?.['y']) return;
    const yScale = scales['y'];
    const zeroY = yScale.getPixelForValue(0);
    if (zeroY < chartArea.top || zeroY > chartArea.bottom) return;
    
    ctx.save();
    const defaultStrokeColor = '#b5bfc8';
    ctx.lineWidth = 1;
    const baseExtensionFraction = 10;
    const dynamicFactor = Math.min(chartArea.width / 500, 1);
    const extensionPercentage = baseExtensionFraction * dynamicFactor;
    
    chart.data.datasets.forEach((_, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar,index) => {
        

        const groupLabel = data.labels?.[index] as string | undefined;
        const strokeColor = (groupLabel === '45 min. +' || groupLabel === '90 min. +')
          ? "#ebebea" : defaultStrokeColor;
        ctx.strokeStyle = strokeColor;

        const { x, width } = bar.getProps(['x', 'width'], true);
        const barLeft = x - width / 2;
        const barRight = x + width / 2;
        const extend = width * extensionPercentage;
        const lineLeft = barLeft - extend;
        const lineRight = barRight + extend;
        const safeLineLeft = Math.max(lineLeft, chartArea.left);
        const safeLineRight = Math.min(lineRight, chartArea.right);
        ctx.beginPath();
        ctx.moveTo(safeLineLeft, zeroY);
        ctx.lineTo(safeLineRight, zeroY);
        ctx.stroke();
      });
    });
    ctx.restore();
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BaseChartDirective, NgFor,NgStyle],
  template: `

<div style="display: flex; align-items: center; background-color:#f7f6f6; padding:16px;">
  
  <!-- Left column: BVB & STP logos -->
  <div style="
    display: flex; 
    flex-direction: column; 
    align-items: center; /* or center, depending on your preference */
    justify-content: center; 
    margin-right: 24px; /* space between logos and charts */
  ">
    <!-- BVB row -->
    <div style="
      display: flex; 
      align-items: center; 
      gap: 12px; 
      margin-bottom: 16px;
      margin-top: -40px;
    ">
          <strong>BVB</strong>

      <img 
        src="assets/bvp.svg" 
        alt="BVB" 
        style="height: 24px; width: auto;"
      />
    </div>

    <!-- STP row -->
    <div style="
      display: flex; 
      align-items: center; 
      gap: 12px;
    ">
          <strong>STP</strong>

      <img 
        src="assets/stp.svg" 
        alt="STP" 
        style="height: 24px; width: auto;"
      />
    </div>
  </div>

  <!-- Right column: your multiple mini-charts in a horizontal row. -->
  <div style="
    flex: 1; 
    display: flex; 
    flex-wrap: nowrap; 
    gap: 0; 
    overflow-x: auto;
  ">
    <div 
      *ngFor="let data of singleChartsData" 
      [ngStyle]="{
    'margin-right': data?.labels?.[0] === '45 min. +' ? '40px' : '0'
  }"
      style="width: 100px; height: 250px; border: none; margin: 0; padding: 0;"
    >
      <canvas
        baseChart
        [data]="data"
        type="bar"
        [options]="singleChartOptions"
        [plugins]="singleChartPlugins"
      >
      </canvas>
    </div>
  </div>
</div>

  `,
  styles: []
})
export class AppComponent {
  public barChartType: ChartType = 'bar';

  // Data configuration for 20 time intervals with BVB and STP values.
  public chartConfig = [
    { label: '1 - 5 min.',  bvb: 2.42, stp: -2.10 },
    { label: '6 - 10 min.',  bvb: 2.65, stp: -2.32 },
    { label: '11 - 15 min.', bvb: 3.10, stp: -2.88 },
    { label: '16 - 20 min.', bvb: 2.54, stp: -2.99 },
    { label: '21 - 25 min.', bvb: 2.35, stp: -2.20 },
    { label: '26 - 30 min.', bvb: 2.65, stp: -2.10 },
    { label: '31 - 35 min.', bvb: 3.10, stp: -2.99 },
    { label: '36 - 40 min.', bvb: 2.54, stp: -2.20 },
    { label: '41 - 45 min.', bvb: 2.35, stp: -2.10 },
    { label: '45 min. +',    bvb: 2.65, stp: -2.88 },
    { label: '46 - 50 min.', bvb: 2.42, stp: -2.10 },
    { label: '51 - 55 min.', bvb: 2.65, stp: -2.32 },
    { label: '56 - 60 min.', bvb: 3.10, stp: -2.88 },
    { label: '61 - 65 min.', bvb: 2.54, stp: -2.99 },
    { label: '66 - 70 min.', bvb: 2.35, stp: -2.20 },
    { label: '71 - 75 min.', bvb: 2.65, stp: -2.10 },
    { label: '76 - 80 min.', bvb: 3.10, stp: -2.99 },
    { label: '81 - 85 min.', bvb: 2.54, stp: -2.20 },
    { label: '86 - 90 min.', bvb: 2.35, stp: -2.10 },
    { label: '90 min. +',    bvb: 2.65, stp: -2.88 }
  ];

  // Transform each configuration entry into a ChartData object (each mini-chart).
  public singleChartsData: ChartData<'bar'>[] = this.chartConfig.map(cfg => ({
    labels: [cfg.label],
    datasets: [
      {
        label: 'BVB',
        data: [cfg.bvb],
        backgroundColor: '#FFD500',
        barThickness: 18,
        datalabels: {
          anchor: 'start',
          align: 'end',
          offset: 70,
          color: (context: DataLabelsContext) => {
            const bvbValue = context.dataset.data[0] as number;
            // Get STP's absolute value for comparison
            const stpValue = Math.abs(context.chart.data.datasets[1].data[0] as number);
            return bvbValue >= stpValue ? '#1e2d36' : '#7B888E';
          },
          font: { size: 12, weight: 'bold' },
          formatter: (value: number) => value.toFixed(2)
        }
      },
      {
        label: 'STP',
        data: [cfg.stp],
        backgroundColor: '#4E2A1E',
        barThickness: 18,
        datalabels: {
          anchor: 'end',
          align: 'bottom',
          offset: 70,
          color: (context: DataLabelsContext) => {
            const stpValue = Math.abs(context.chart.data.datasets[1].data[0] as number);
            const bvbValue = context.chart.data.datasets[0].data[0] as number;
            return stpValue > bvbValue ? '#1e2d36' : '#7B888E';
          },
          font: { size: 12, weight: 'bold' },
          formatter: (value: number) => Math.abs(value).toFixed(2)
        }
      }
    ]
  }));

  // Chart.js options for each mini-chart.
  public singleChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        display: true,
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: {
          display: true,
          color: '#7B888E',
          font: { size: 12, weight: 'bold' },
          autoSkip: false
        }
      },
      y: {
        display: false,
        stacked: true,
        border: { display: false },
        min: -5,
        max: 5
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: { clip: false },
      title: { display: false }
    },
    layout: {
      padding: { top: 10, bottom: 20, left: 0, right: 0 }
    }
  };

  // Shared plugins for every mini-chart.
  public singleChartPlugins = [ChartDataLabels, zeroLineSegmentsPerBarPlugin];
}

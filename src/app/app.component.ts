import { Component, OnInit, OnDestroy } from '@angular/core';
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

/* ============================
   Zero Line Plugin
   ============================ */
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
      meta.data.forEach((bar, index) => {
        const groupLabel = data.labels?.[index] as string | undefined;
        const strokeColor =
          groupLabel === '45 min. +' || groupLabel === '90 min. +' ? '#ebebea' : defaultStrokeColor;
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
  imports: [BaseChartDirective, NgFor, NgStyle],
  template: `
    <div class="app-container">
      <!-- Logos in left column -->
      <div class="logo-column">
        <div class="logo-item">

          <strong>BVB</strong>
          <img src="assets/bvp.svg" alt="BVB" />
        </div>
        <div class="logo-item">
          <strong>STP</strong>
          <img src="assets/stp.svg" alt="STP" />
        </div>
      </div>

      <!-- Horizontal charts container -->
      <div class="chart-container">
        <div
          *ngFor="let data of singleChartsData"
          class="chart-item"
          [ngStyle]="{
            'margin-right': data?.labels?.[0] === '45 min. +' ? '40px' : '0'
          }"
        >
          <canvas
            baseChart
            [data]="data"
            type="bar"
            [options]="singleChartOptions"
            [plugins]="singleChartPlugins"
          ></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Overall horizontal layout */
    .app-container {
      display: flex;
      align-items: center;
      justify-content:center;
      background-color: #f7f6f6;
      padding: 64px;
      flex-wrap: nowrap;
    }
    /* Logo column styling */
    .logo-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-right: 0px;
      margin-top: -20px;
    }
    .logo-item {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .logo-item strong{
      flex : 1;
    }

    .logo-item img {
      height: 24px;
      width: 24px;
    }
    /* Horizontal charts container */
    .chart-container {
      display: flex;
      flex-wrap: nowrap;
      width: 100%;
    }
    /* Each chart is evenly distributed */
    .chart-item {
      flex: 0 0 calc(100% / 20);
      height: 250px;
      box-sizing: border-box;
    }
    .chart-item canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  public barChartType: ChartType = 'bar';

  public minuteLabels: string[] = [
    '1 - 5 min.', '6 - 10 min.', '11 - 15 min.', '16 - 20 min.', '21 - 25 min.',
    '26 - 30 min.', '31 - 35 min.', '36 - 40 min.', '41 - 45 min.', '45 min. +',
    '46 - 50 min.', '51 - 55 min.', '56 - 60 min.', '61 - 65 min.', '66 - 70 min.',
    '71 - 75 min.', '76 - 80 min.', '81 - 85 min.', '86 - 90 min.', '90 min. +'
  ];

  public chartData: { bvb: number; stp: number }[] = [];
  public singleChartsData: ChartData<'bar'>[] = [];
  public singleChartOptions!: ChartOptions<'bar'>;
  public singleChartPlugins = [ChartDataLabels, zeroLineSegmentsPerBarPlugin];

  // Store the resize event handler for cleanup.
  private resizeListener = () => this.setChartOptions(window.innerWidth);

  ngOnInit() {
    this.loadChartData();
    // Initialize chart options.
    this.setChartOptions(window.innerWidth);
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  loadChartData() {
    this.chartData = [
      { bvb: 2.42, stp: -2.10 }, { bvb: 2.65, stp: -2.32 }, { bvb: 3.10, stp: -2.88 },
      { bvb: 2.54, stp: -2.99 }, { bvb: 2.35, stp: -2.20 }, { bvb: 2.65, stp: -2.10 },
      { bvb: 3.10, stp: -2.99 }, { bvb: 2.54, stp: -2.20 }, { bvb: 2.35, stp: -2.10 },
      { bvb: 2.65, stp: -2.88 }, { bvb: 2.42, stp: -2.10 }, { bvb: 2.65, stp: -2.32 },
      { bvb: 3.10, stp: -2.88 }, { bvb: 2.54, stp: -2.99 }, { bvb: 2.35, stp: -2.20 },
      { bvb: 2.65, stp: -2.10 }, { bvb: 3.10, stp: -2.99 }, { bvb: 2.54, stp: -2.20 },
      { bvb: 2.35, stp: -2.10 }, { bvb: 2.65, stp: -2.88 }
    ];
    this.buildChartData();
  }

  buildChartData() {
    this.singleChartsData = this.minuteLabels.map((label, i) => {
      const entry = this.chartData[i] || { bvb: 0, stp: 0 };
      return {
        labels: [label],
        datasets: [
          {
            label: 'BVB',
            data: [entry.bvb],
            backgroundColor: '#FFD500',
            barThickness: 18,
            datalabels: {
              anchor: 'start',
              align: 'end',
              offset: 70,
              color: (context: DataLabelsContext) => {
                const bvbValue = context.dataset.data[0] as number;
                const stpValue = Math.abs(context.chart.data.datasets[1].data[0] as number);
                return bvbValue >= stpValue ? '#1e2d36' : '#7B888E';
              },
              font: { size: 12, weight: 'bold' },
              formatter: (value: number) => value.toFixed(2)
            }
          },
          {
            label: 'STP',
            data: [entry.stp],
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
      };
    });
  }

  /**
   * Dynamically sets chart options based on screen width.
   * Uses rem-based sizing by converting desired rem units to pixels.
   */
  private setChartOptions(screenWidth: number) {
    const isSmallScreen = screenWidth < 600;
    
    // Determine the root (html) font size in pixels.
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize || '16'
    );
    // Define desired font sizes in rem units.
    const largeFontRem = 0.75; // 0.75rem for larger screens
    const smallFontRem = 0.50; // 0.56rem for smaller screens
    
    // Convert rem units to pixels.
    const fontSize = isSmallScreen ? smallFontRem * rootFontSize : largeFontRem * rootFontSize;

    this.singleChartOptions = {
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
            font: {
              size: fontSize,
              weight: 'bold'
            },
            maxRotation: isSmallScreen ? 60 : 0,
            minRotation: isSmallScreen ? 60 : 0,
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
  }
}

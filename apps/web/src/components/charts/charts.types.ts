export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  meta?: Record<string, any>;
}

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface AreaChartSeries {
  key: string;
  label: string;
  color: string;
  gradientId: string;
}

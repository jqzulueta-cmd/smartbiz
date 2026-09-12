'use client';

import { useEffect, useState } from 'react';
import KPICards from '@/components/dashboard/KPICards';
import { SalesTrendChart, DemandForecastChart, ForecastSummaryTable } from '@/components/dashboard/SalesForecastChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { KPIData, SalesTrendPoint, ProductForecast } from '@/types';

export default function AnalyticsPage() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

  useEffect(() => {
    fetch(`/api/analytics/forecast?days=${days}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setKpi(data.data.kpi);
          setTrend(data.data.salesTrend);
          setForecasts(data.data.forecasts);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Forecasting</h1>
          <p className="text-muted-foreground">Sales performance and demand predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Forecast period:</span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {kpi && <KPICards data={kpi} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesTrendChart data={trend} />
        <DemandForecastChart forecasts={forecasts} />
      </div>

      <ForecastSummaryTable forecasts={forecasts} />
    </div>
  );
}

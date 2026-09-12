'use client';

import { useEffect, useState } from 'react';
import KPICards from '@/components/dashboard/KPICards';
import { SalesTrendChart, DemandForecastChart, ForecastSummaryTable } from '@/components/dashboard/SalesForecastChart';
import type { KPIData, SalesTrendPoint, ProductForecast } from '@/types';

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/forecast')
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
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

'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ColumnProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MissingnessHeatmapProps {
  columns: ColumnProfile[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm border rounded-lg shadow-lg bg-popover text-popover-foreground">
        <p className="font-bold">{label}</p>
        <p>Missing: {`${payload[0].value.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};

const MissingnessHeatmap = ({ columns }: MissingnessHeatmapProps) => {
  const chartData = columns.map(col => ({
    name: col.name,
    missing: col.missingPercentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Missing Data Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
              <Bar dataKey="missing" fill="hsl(var(--primary))" background={{ fill: 'hsl(var(--muted) / 0.2)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MissingnessHeatmap;

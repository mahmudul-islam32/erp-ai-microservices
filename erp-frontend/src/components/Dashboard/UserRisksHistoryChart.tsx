import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../store/hooks';

export const UserRisksHistoryChart: React.FC = () => {
  const { userRisksHistory } = useAppSelector(state => state.dashboard);

  // Generate scatter plot data
  const historyData = [
    // Not Executed data points
    ...Array.from({ length: 50 }, (_, i) => ({
      x: i * 0.5,
      y: 12000 + Math.random() * 2000,
      category: 'Not Executed',
      color: '#8B5CF6'
    })),
    // Partially Executed data points
    ...Array.from({ length: 40 }, (_, i) => ({
      x: i * 0.5,
      y: 8000 + Math.random() * 1500,
      category: 'Partially Executed',
      color: '#3B82F6'
    })),
    // Fully Executed data points
    ...Array.from({ length: 60 }, (_, i) => ({
      x: i * 0.5,
      y: 15000 + Math.random() * 3000,
      category: 'Fully Executed',
      color: '#10B981'
    }))
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="sap-chart-tooltip">
          <p className="sap-chart-tooltip-label">{data.category}</p>
          <p style={{ color: data.color }}>
            Value: {Math.round(data.y)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sap-chart-container">
      <div className="sap-chart-header">
        <span className="sap-chart-date">2018-05-08</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart
          data={historyData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis 
            type="number"
            dataKey="x"
            domain={[0, 30]}
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <YAxis 
            type="number"
            dataKey="y"
            domain={[0, 18000]}
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            dataKey="y" 
            fill="#8884d8"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload.color}
                  stroke={payload.color}
                  strokeWidth={1}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

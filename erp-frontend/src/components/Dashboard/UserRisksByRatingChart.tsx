import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../store/hooks';

export const UserRisksByRatingChart: React.FC = () => {
  const { userRisksByRating } = useAppSelector(state => state.dashboard);

  const ratingData = [
    {
      name: 'INFORMATIONAL',
      notExecuted: 2000,
      partiallyExecuted: 300,
      fullyExecuted: 100,
      total: 2400
    },
    {
      name: 'LOW',
      notExecuted: 800,
      partiallyExecuted: 600,
      fullyExecuted: 400,
      total: 1800
    },
    {
      name: 'MEDIUM',
      notExecuted: 400,
      partiallyExecuted: 500,
      fullyExecuted: 800,
      total: 1700
    },
    {
      name: 'HIGH',
      notExecuted: 200,
      partiallyExecuted: 300,
      fullyExecuted: 500,
      total: 1000
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="sap-chart-tooltip">
          <p className="sap-chart-tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sap-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={ratingData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="notExecuted" stackId="a" fill="#8B5CF6" name="Not Executed" />
          <Bar dataKey="partiallyExecuted" stackId="a" fill="#3B82F6" name="Partially Executed" />
          <Bar dataKey="fullyExecuted" stackId="a" fill="#10B981" name="Fully Executed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

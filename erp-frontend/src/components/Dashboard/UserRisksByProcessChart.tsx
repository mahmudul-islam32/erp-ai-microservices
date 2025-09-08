import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppSelector } from '../../store/hooks';

export const UserRisksByProcessChart: React.FC = () => {
  const { userRisksByProcess } = useAppSelector(state => state.dashboard);

  // Group data by process
  const processData = [
    {
      name: 'Sales & Delivery',
      notExecuted: 1650,
      partiallyExecuted: 503,
      fullyExecuted: 230,
      total: 2383
    },
    {
      name: 'Accounts Payable',
      notExecuted: 1200,
      partiallyExecuted: 400,
      fullyExecuted: 200,
      total: 1800
    },
    {
      name: 'Project Systems',
      notExecuted: 800,
      partiallyExecuted: 300,
      fullyExecuted: 150,
      total: 1250
    },
    {
      name: 'Controlling',
      notExecuted: 600,
      partiallyExecuted: 250,
      fullyExecuted: 100,
      total: 950
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
      <div className="sap-chart-content">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={processData}
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
      
      {/* Summary Card */}
      <div className="sap-chart-summary">
        <div className="sap-summary-card">
          <h4 className="sap-summary-title">Sales & Delivery</h4>
          <div className="sap-summary-stats">
            <div className="sap-summary-stat">
              <span className="sap-summary-number">1650</span>
              <span className="sap-summary-label">NOT EXECUTED</span>
            </div>
            <div className="sap-summary-stat">
              <span className="sap-summary-number">503</span>
              <span className="sap-summary-label">PARTIALLY EXECUTED</span>
            </div>
            <div className="sap-summary-stat">
              <span className="sap-summary-number">230</span>
              <span className="sap-summary-label">FULLY EXECUTED</span>
            </div>
            <div className="sap-summary-stat sap-summary-total">
              <span className="sap-summary-number">TOTAL: 2383</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

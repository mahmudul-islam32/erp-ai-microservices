import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppSelector } from '../../store/hooks';

export const HighestUnmitigatedRiskChart: React.FC = () => {
  const { highestUnmitigatedRisk } = useAppSelector(state => state.dashboard);

  const data = [
    { name: 'Low', value: 200, color: '#8B5CF6' },
    { name: 'Medium', value: 150, color: '#3B82F6' },
    { name: 'High', value: 198, color: '#10B981' }
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="sap-chart-tooltip">
          <p className="sap-chart-tooltip-label">{data.name}</p>
          <p style={{ color: data.color }}>
            Value: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sap-chart-container">
      <div className="sap-donut-chart">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="sap-donut-center">
          <div className="sap-donut-total">{total}</div>
          <div className="sap-donut-label">TOTAL</div>
        </div>
      </div>
      
      <div className="sap-donut-legend">
        {data.map((item, index) => (
          <div key={index} className="sap-legend-item">
            <div 
              className="sap-legend-color" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="sap-legend-label">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

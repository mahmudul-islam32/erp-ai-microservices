import React from 'react';
import { useAppSelector } from '../../store/hooks';

export const StatusMetrics: React.FC = () => {
  const { metrics } = useAppSelector(state => state.dashboard);

  return (
    <div className="sap-status-metrics">
      <div className="sap-metric-item">
        <span className="sap-metric-label">USERS ANALYZED:</span>
        <span className="sap-metric-value">{metrics.usersAnalyzed.toLocaleString()}</span>
      </div>
      
      <div className="sap-metric-item">
        <span className="sap-metric-label">LICENSE</span>
        <span className="sap-metric-value">{metrics.license}</span>
      </div>
      
      <div className="sap-metric-item">
        <span className="sap-metric-label">MEMBER TCODE EXECUTIONS ANALYZED:</span>
        <span className="sap-metric-value">{metrics.memberTcodeExecutions.toLocaleString()}</span>
      </div>
    </div>
  );
};

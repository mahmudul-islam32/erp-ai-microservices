import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { UserRisksByProcessChart } from './UserRisksByProcessChart';
import { UserRisksByRatingChart } from './UserRisksByRatingChart';
import { UserRisksHistoryChart } from './UserRisksHistoryChart';
import { HighestUnmitigatedRiskChart } from './HighestUnmitigatedRiskChart';
import { StatusMetrics } from './StatusMetrics';
import './SAPDashboard.css';

export const SAPDashboard: React.FC = () => {
  const { metrics } = useAppSelector(state => state.dashboard);

  return (
    <div className="sap-dashboard">
      <div className="sap-dashboard-header">
        <h1 className="sap-dashboard-title">DASHBOARD</h1>
        <div className="sap-dashboard-controls">
          <button className="sap-dashboard-button">EDIT DASHBOARD</button>
          <button className="sap-dashboard-button">FILTERS</button>
          <button className="sap-dashboard-button">TIMELINE</button>
        </div>
      </div>

      <div className="sap-dashboard-content">
        <div className="sap-dashboard-grid">
          {/* User Risks by Business Process */}
          <div className="sap-dashboard-card sap-dashboard-card-large">
            <div className="sap-dashboard-card-header">
              <h3 className="sap-dashboard-card-title">User Risks by Business Process</h3>
            </div>
            <div className="sap-dashboard-card-content">
              <UserRisksByProcessChart />
            </div>
          </div>

          {/* Status Metrics */}
          <div className="sap-dashboard-card sap-dashboard-card-small">
            <div className="sap-dashboard-card-header">
              <h3 className="sap-dashboard-card-title">Status</h3>
            </div>
            <div className="sap-dashboard-card-content">
              <StatusMetrics />
            </div>
          </div>

          {/* User Risks by Rating */}
          <div className="sap-dashboard-card sap-dashboard-card-medium">
            <div className="sap-dashboard-card-header">
              <h3 className="sap-dashboard-card-title">User Risks by Rating</h3>
            </div>
            <div className="sap-dashboard-card-content">
              <UserRisksByRatingChart />
            </div>
          </div>

          {/* User by Highest Unmitigated Executed Risk */}
          <div className="sap-dashboard-card sap-dashboard-card-small">
            <div className="sap-dashboard-card-header">
              <h3 className="sap-dashboard-card-title">User by Highest Unmitigated Executed Risk</h3>
            </div>
            <div className="sap-dashboard-card-content">
              <HighestUnmitigatedRiskChart />
            </div>
          </div>

          {/* User Risks History */}
          <div className="sap-dashboard-card sap-dashboard-card-large">
            <div className="sap-dashboard-card-header">
              <h3 className="sap-dashboard-card-title">User Risks History</h3>
            </div>
            <div className="sap-dashboard-card-content">
              <UserRisksHistoryChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface DashboardMetrics {
  usersAnalyzed: number;
  license: string;
  memberTcodeExecutions: number;
  total: number;
}

export interface DashboardState {
  metrics: DashboardMetrics;
  userRisksByProcess: ChartData[];
  userRisksByRating: ChartData[];
  userRisksHistory: ChartData[];
  highestUnmitigatedRisk: ChartData[];
  loading: boolean;
}

const initialState: DashboardState = {
  metrics: {
    usersAnalyzed: 3001,
    license: 'Standard',
    memberTcodeExecutions: 6948,
    total: 2383,
  },
  userRisksByProcess: [
    { name: 'Sales & Delivery', value: 1650, color: '#8B5CF6' },
    { name: 'Sales & Delivery', value: 503, color: '#3B82F6' },
    { name: 'Sales & Delivery', value: 230, color: '#10B981' },
    { name: 'Accounts Payable', value: 1200, color: '#8B5CF6' },
    { name: 'Accounts Payable', value: 400, color: '#3B82F6' },
    { name: 'Accounts Payable', value: 200, color: '#10B981' },
    { name: 'Project Systems', value: 800, color: '#8B5CF6' },
    { name: 'Project Systems', value: 300, color: '#3B82F6' },
    { name: 'Project Systems', value: 150, color: '#10B981' },
    { name: 'Controlling', value: 600, color: '#8B5CF6' },
    { name: 'Controlling', value: 250, color: '#3B82F6' },
    { name: 'Controlling', value: 100, color: '#10B981' },
  ],
  userRisksByRating: [
    { name: 'INFORMATIONAL', value: 2000, color: '#8B5CF6' },
    { name: 'INFORMATIONAL', value: 300, color: '#3B82F6' },
    { name: 'INFORMATIONAL', value: 100, color: '#10B981' },
    { name: 'LOW', value: 800, color: '#8B5CF6' },
    { name: 'LOW', value: 600, color: '#3B82F6' },
    { name: 'LOW', value: 400, color: '#10B981' },
    { name: 'MEDIUM', value: 400, color: '#8B5CF6' },
    { name: 'MEDIUM', value: 500, color: '#3B82F6' },
    { name: 'MEDIUM', value: 800, color: '#10B981' },
    { name: 'HIGH', value: 200, color: '#8B5CF6' },
    { name: 'HIGH', value: 300, color: '#3B82F6' },
    { name: 'HIGH', value: 500, color: '#10B981' },
  ],
  userRisksHistory: [
    { name: 'Not Executed', value: 12000, color: '#8B5CF6' },
    { name: 'Partially Executed', value: 8000, color: '#3B82F6' },
    { name: 'Fully Executed', value: 15000, color: '#10B981' },
  ],
  highestUnmitigatedRisk: [
    { name: 'Low', value: 200, color: '#8B5CF6' },
    { name: 'Medium', value: 150, color: '#3B82F6' },
    { name: 'High', value: 198, color: '#10B981' },
  ],
  loading: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setMetrics: (state, action: PayloadAction<DashboardMetrics>) => {
      state.metrics = action.payload;
    },
    setUserRisksByProcess: (state, action: PayloadAction<ChartData[]>) => {
      state.userRisksByProcess = action.payload;
    },
    setUserRisksByRating: (state, action: PayloadAction<ChartData[]>) => {
      state.userRisksByRating = action.payload;
    },
    setUserRisksHistory: (state, action: PayloadAction<ChartData[]>) => {
      state.userRisksHistory = action.payload;
    },
    setHighestUnmitigatedRisk: (state, action: PayloadAction<ChartData[]>) => {
      state.highestUnmitigatedRisk = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setMetrics,
  setUserRisksByProcess,
  setUserRisksByRating,
  setUserRisksHistory,
  setHighestUnmitigatedRisk,
  setLoading,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

import React from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

const salesData = [
  { month: 'Jan', sales: 4000, orders: 240 },
  { month: 'Feb', sales: 3000, orders: 198 },
  { month: 'Mar', sales: 2000, orders: 180 },
  { month: 'Apr', sales: 2780, orders: 220 },
  { month: 'May', sales: 1890, orders: 150 },
  { month: 'Jun', sales: 2390, orders: 180 },
];

const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down';
}> = ({ title, value, change, icon: Icon, trend }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
              {change}
            </p>
          </div>
          <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-success-100' : 'bg-danger-100'}`}>
            <Icon className={`h-6 w-6 ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your business."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          change="+12.5% from last month"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value="1,234"
          change="+8.2% from last month"
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="Total Customers"
          value="892"
          change="+4.3% from last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Products"
          value="456"
          change="-2.1% from last month"
          icon={Package}
          trend="down"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="Sales Overview" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Orders Trend" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader title="Recent Activity" />
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'New order #1234 created', time: '2 minutes ago' },
              { action: 'Product "Widget Pro" updated', time: '15 minutes ago' },
              { action: 'Customer "John Doe" registered', time: '1 hour ago' },
              { action: 'Invoice #INV-001 sent', time: '3 hours ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm text-slate-700">{item.action}</p>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


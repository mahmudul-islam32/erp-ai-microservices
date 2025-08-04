import { useState } from 'react';
import { AppShell, Navbar, Header, Text, MediaQuery, Burger, useMantineTheme, Box, NavLink, Divider, Group, ScrollArea } from '@mantine/core';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  IconHome, IconUsers, IconBriefcase, IconSettings, IconLogout, 
  IconReportAnalytics, IconCalendar, IconShield, IconKey, 
  IconUserPlus, IconUsersGroup, IconLock,
  IconFingerprint, IconUserCog, IconChevronRight,
  IconPackage, IconShoppingCart, IconCurrencyDollar, IconUserCircle
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

export function DashboardLayout() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(true); // Always start with sidebar open
  const [authExpanded, setAuthExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [hrExpanded, setHrExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define navigation items with access control
  const coreNavItems = [
    { 
      label: 'Dashboard', 
      icon: <IconHome size={20} />, 
      path: '/dashboard', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] 
    },
  ];

  // Authentication & User Management Section
  const authNavItems = [
    { 
      label: 'User Management', 
      icon: <IconUsers size={20} />, 
      path: '/dashboard/users', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Manage users, roles & permissions'
    },
    { 
      label: 'Create User', 
      icon: <IconUserPlus size={20} />, 
      path: '/dashboard/users/create', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      description: 'Add new users to the system'
    },
    { 
      label: 'Role Management', 
      icon: <IconUsersGroup size={20} />, 
      path: '/dashboard/roles', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      description: 'Configure roles and permissions'
    },
    { 
      label: 'Security Settings', 
      icon: <IconShield size={20} />, 
      path: '/dashboard/security', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      description: 'Authentication & security policies'
    },
    { 
      label: 'Access Control', 
      icon: <IconLock size={20} />, 
      path: '/dashboard/access-control', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      description: 'Role-based permissions'
    },
    { 
      label: 'Session Management', 
      icon: <IconKey size={20} />, 
      path: '/dashboard/sessions', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      description: 'Active sessions & tokens'
    },
    { 
      label: 'Audit Logs', 
      icon: <IconFingerprint size={20} />, 
      path: '/dashboard/audit', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Authentication & activity logs'
    },
  ];

  // Inventory Management Section
  const inventoryNavItems = [
    { 
      label: 'Inventory Dashboard', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/inventory', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      description: 'Inventory overview & statistics'
    },
    { 
      label: 'Products', 
      icon: <IconPackage size={20} />, 
      path: '/dashboard/inventory/products', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      description: 'Manage product catalog'
    },
    { 
      label: 'Stock Management', 
      icon: <IconPackage size={20} />, 
      path: '/dashboard/inventory/stock', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      description: 'Track inventory levels'
    },
    { 
      label: 'Warehouses', 
      icon: <IconBriefcase size={20} />, 
      path: '/dashboard/inventory/warehouses', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Manage warehouse locations'
    },
    { 
      label: 'Categories', 
      icon: <IconUsersGroup size={20} />, 
      path: '/dashboard/inventory/categories', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Product categories'
    },
  ];

  // Sales Management Section
  const salesNavItems = [
    { 
      label: 'Orders', 
      icon: <IconShoppingCart size={20} />, 
      path: '/dashboard/sales/orders', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      description: 'Manage customer orders'
    },
    { 
      label: 'Customers', 
      icon: <IconUserCircle size={20} />, 
      path: '/dashboard/sales/customers', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
      description: 'Customer management'
    },
    { 
      label: 'Invoices', 
      icon: <IconCurrencyDollar size={20} />, 
      path: '/dashboard/sales/invoices', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Invoice management'
    },
    { 
      label: 'Reports', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/sales/reports', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Sales analytics'
    },
  ];

  // Finance Management Section
  const financeNavItems = [
    { 
      label: 'Accounting', 
      icon: <IconCurrencyDollar size={20} />, 
      path: '/dashboard/finance/accounting', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'General ledger & accounts'
    },
    { 
      label: 'Payments', 
      icon: <IconCurrencyDollar size={20} />, 
      path: '/dashboard/finance/payments', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Payment processing'
    },
    { 
      label: 'Budget', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/finance/budget', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Budget planning'
    },
    { 
      label: 'Reports', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/finance/reports', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Financial reports'
    },
  ];

  // HR Management Section
  const hrNavItems = [
    { 
      label: 'Employees', 
      icon: <IconUsers size={20} />, 
      path: '/dashboard/hr/employees', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Employee management'
    },
    { 
      label: 'Payroll', 
      icon: <IconCurrencyDollar size={20} />, 
      path: '/dashboard/hr/payroll', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Payroll management'
    },
    { 
      label: 'Attendance', 
      icon: <IconCalendar size={20} />, 
      path: '/dashboard/hr/attendance', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Attendance tracking'
    },
    { 
      label: 'Performance', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/hr/performance', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER],
      description: 'Performance reviews'
    },
  ];

  // Business Operations Section
  const businessNavItems = [
    { 
      label: 'Departments', 
      icon: <IconBriefcase size={20} />, 
      path: '/dashboard/departments', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] 
    },
    { 
      label: 'Calendar', 
      icon: <IconCalendar size={20} />, 
      path: '/dashboard/calendar', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] 
    },
    { 
      label: 'Reports', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/reports', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] 
    },
  ];

  // System Configuration Section
  const systemNavItems = [
    { 
      label: 'System Settings', 
      icon: <IconSettings size={20} />, 
      path: '/dashboard/settings', 
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] 
    },
  ];

  const renderNavSection = (title: string, items: Array<{
    label: string;
    icon: JSX.Element;
    path: string;
    roles: UserRole[];
    description?: string;
  }>, isFirst = false) => {
    const filteredItems = items.filter(item => {
      if (!user) return false;
      return item.roles.includes(user.role as UserRole);
    });

    if (filteredItems.length === 0) return null;

    return (
      <>
        {!isFirst && <Divider my="md" />}
        <Text size="xs" weight={700} color="dimmed" tt="uppercase" mb="xs" px="xs">
          {title}
        </Text>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            description={item.description}
            icon={item.icon}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setOpened(false);
            }}
            mb={4}
            styles={(theme) => ({
              root: {
                borderRadius: theme.radius.sm,
                '&:hover': {
                  backgroundColor: theme.colors.blue[0],
                },
              },
              label: {
                fontSize: theme.fontSizes.sm,
              },
              description: {
                fontSize: theme.fontSizes.xs,
                color: theme.colors.gray[6],
              },
            })}
          />
        ))}
      </>
    );
  };

  const renderDropdownSection = (
    title: string, 
    items: Array<{
      label: string;
      icon: JSX.Element;
      path: string;
      roles: UserRole[];
      description?: string;
    }>, 
    expanded: boolean, 
    setExpanded: (expanded: boolean) => void,
    mainIcon: JSX.Element
  ) => {
    const filteredItems = items.filter(item => {
      if (!user) return false;
      return item.roles.includes(user.role as UserRole);
    });

    if (filteredItems.length === 0) return null;

    return (
      <>
        <NavLink
          label={title}
          icon={mainIcon}
          rightSection={
            <IconChevronRight 
              size={14} 
              style={{ 
                transform: expanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s'
              }} 
            />
          }
          onClick={() => setExpanded(!expanded)}
          mb={2}
          styles={(theme) => ({
            root: {
              borderRadius: theme.radius.sm,
              '&:hover': {
                backgroundColor: theme.colors.blue[0],
              },
            },
            label: {
              fontSize: theme.fontSizes.sm,
              fontWeight: 600,
            },
          })}
        />
        
        {expanded && (
          <Box ml="md" mb="sm">
            {filteredItems.map((item) => (
              <NavLink
                key={item.path}
                label={item.label}
                description={item.description}
                icon={item.icon}
                active={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) {
                    setOpened(false);
                  }
                }}
                mb={2}
                styles={(theme) => ({
                  root: {
                    borderRadius: theme.radius.sm,
                    fontSize: theme.fontSizes.xs,
                    '&:hover': {
                      backgroundColor: theme.colors.blue[0],
                    },
                  },
                  label: {
                    fontSize: theme.fontSizes.xs,
                  },
                  description: {
                    fontSize: '10px',
                    color: theme.colors.gray[6],
                  },
                })}
              />
            ))}
          </Box>
        )}
      </>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar 
          p="md" 
          width={{ base: 300 }} 
          hiddenBreakpoint="sm"
        >
          <Navbar.Section grow component={ScrollArea}>
            {/* Core Navigation */}
            {renderNavSection('Overview', coreNavItems, true)}
            
            {/* Authentication & User Management */}
            <Divider my="md" />
            {renderDropdownSection(
              'Authentication & Users', 
              authNavItems, 
              authExpanded, 
              setAuthExpanded,
              <IconUsers size={20} />
            )}
            
            {/* Inventory Management */}
            {renderDropdownSection(
              'Inventory Management', 
              inventoryNavItems, 
              inventoryExpanded, 
              setInventoryExpanded,
              <IconPackage size={20} />
            )}
            
            {/* Sales Management */}
            {renderDropdownSection(
              'Sales Management', 
              salesNavItems, 
              salesExpanded, 
              setSalesExpanded,
              <IconShoppingCart size={20} />
            )}
            
            {/* Finance Management */}
            {renderDropdownSection(
              'Finance Management', 
              financeNavItems, 
              financeExpanded, 
              setFinanceExpanded,
              <IconCurrencyDollar size={20} />
            )}
            
            {/* HR Management */}
            {renderDropdownSection(
              'Human Resources', 
              hrNavItems, 
              hrExpanded, 
              setHrExpanded,
              <IconUsers size={20} />
            )}
            
            {/* Business Operations */}
            {renderNavSection('Business Operations', businessNavItems)}
            
            {/* System Configuration */}
            {renderNavSection('System', systemNavItems)}
          </Navbar.Section>
          
          <Navbar.Section>
            <Divider mb="md" />
            <NavLink
              label="Logout"
              icon={<IconLogout size={20} />}
              onClick={handleLogout}
              styles={(theme) => ({
                root: {
                  borderRadius: theme.radius.sm,
                  color: theme.colors.red[6],
                  '&:hover': {
                    backgroundColor: theme.colors.red[0],
                  },
                },
              })}
            />
            <Box mt="md" p="sm" bg="gray.1" sx={{ borderRadius: theme.radius.sm }}>
              <Group spacing="xs">
                <IconUserCog size={16} />
                <Text size="sm" weight={500}>{user?.first_name} {user?.last_name}</Text>
              </Group>
              <Text size="xs" color="dimmed">{user?.email}</Text>
              <Text size="xs" color={theme.colors.blue[6]} mt={4}>
                {user?.role.toUpperCase()}
              </Text>
            </Box>
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={60} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>
            <Text size="lg" weight={700}>ERP System</Text>
          </div>
        </Header>
      }
      styles={(theme) => ({
        main: { backgroundColor: theme.colors.gray[0] },
      })}
    >
      <Outlet />
    </AppShell>
  );
}

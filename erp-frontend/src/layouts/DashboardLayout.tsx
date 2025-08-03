import { useState } from 'react';
import { AppShell, Navbar, Header, Text, MediaQuery, Burger, useMantineTheme, Box, NavLink } from '@mantine/core';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  IconHome, IconUsers, IconBriefcase, IconSettings, IconLogout, 
  IconReportAnalytics, IconCalendar
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

export function DashboardLayout() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define navigation items with access control
  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <IconHome size={20} />, 
      path: '/dashboard', 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER] 
    },
    { 
      label: 'Users', 
      icon: <IconUsers size={20} />, 
      path: '/dashboard/users', 
      roles: [UserRole.ADMIN, UserRole.MANAGER] 
    },
    { 
      label: 'Departments', 
      icon: <IconBriefcase size={20} />, 
      path: '/dashboard/departments', 
      roles: [UserRole.ADMIN, UserRole.MANAGER] 
    },
    { 
      label: 'Calendar', 
      icon: <IconCalendar size={20} />, 
      path: '/dashboard/calendar', 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER] 
    },
    { 
      label: 'Reports', 
      icon: <IconReportAnalytics size={20} />, 
      path: '/dashboard/reports', 
      roles: [UserRole.ADMIN, UserRole.MANAGER] 
    },
    { 
      label: 'Settings', 
      icon: <IconSettings size={20} />, 
      path: '/dashboard/settings', 
      roles: [UserRole.ADMIN] 
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar p="md" width={{ base: 300 }} hiddenBreakpoint="sm" hidden={!opened}>
          <Navbar.Section grow>
            {navItems.map((item) => {
              // Only show menu items for roles the user has access to
              if (user && item.roles.includes(user.role as UserRole)) {
                return (
                  <NavLink
                    key={item.path}
                    label={item.label}
                    icon={item.icon}
                    active={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path);
                      setOpened(false);
                    }}
                    mb={8}
                  />
                );
              }
              return null;
            })}
          </Navbar.Section>
          
          <Navbar.Section>
            <NavLink
              label="Logout"
              icon={<IconLogout size={20} />}
              onClick={handleLogout}
            />
            <Box mt="md" p="sm" bg="gray.1" sx={{ borderRadius: theme.radius.sm }}>
              <Text size="sm" weight={500}>{user?.first_name} {user?.last_name}</Text>
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

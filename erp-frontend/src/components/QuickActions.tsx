import React from 'react';
import { Group, Button, Menu, ActionIcon } from '@mantine/core';
import {
  IconPlus,
  IconFileInvoice,
  IconFileText,
  IconShoppingCart,
  IconDotsVertical,
  IconUsers,
  IconChartLine
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  variant?: 'horizontal' | 'dropdown';
  customerId?: string;
  orderId?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  variant = 'horizontal', 
  customerId, 
  orderId 
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'New Customer',
      icon: <IconUsers size={16} />,
      action: () => navigate('/dashboard/sales/customers/create'),
      color: 'blue'
    },
    {
      label: 'New Order',
      icon: <IconShoppingCart size={16} />,
      action: () => navigate(`/dashboard/sales/orders/create${customerId ? `?customerId=${customerId}` : ''}`),
      color: 'green'
    },
    {
      label: 'New Quote',
      icon: <IconFileText size={16} />,
      action: () => navigate(`/dashboard/sales/quotes/create${customerId ? `?customerId=${customerId}` : ''}`),
      color: 'orange'
    },
    {
      label: 'New Invoice',
      icon: <IconFileInvoice size={16} />,
      action: () => navigate(`/dashboard/sales/invoices/create${customerId ? `?customerId=${customerId}` : orderId ? `?orderId=${orderId}` : ''}`),
      color: 'violet'
    },
    {
      label: 'Analytics',
      icon: <IconChartLine size={16} />,
      action: () => navigate('/dashboard/sales/analytics'),
      color: 'teal'
    }
  ];

  if (variant === 'dropdown') {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon variant="filled" color="blue" size="lg">
            <IconPlus size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Quick Actions</Menu.Label>
          {actions.map((action, index) => (
            <Menu.Item
              key={index}
              icon={action.icon}
              onClick={action.action}
            >
              {action.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Group spacing="sm">
      {actions.slice(0, 4).map((action, index) => (
        <Button
          key={index}
          variant="light"
          leftIcon={action.icon}
          color={action.color}
          size="sm"
          onClick={action.action}
        >
          {action.label}
        </Button>
      ))}
      {actions.length > 4 && (
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="light" size="lg">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {actions.slice(4).map((action, index) => (
              <Menu.Item
                key={index}
                icon={action.icon}
                onClick={action.action}
              >
                {action.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
    </Group>
  );
};

export default QuickActions;

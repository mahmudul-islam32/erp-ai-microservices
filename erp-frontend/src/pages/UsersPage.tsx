import { useState, useEffect, useCallback } from 'react';
import { SAPPageLayout } from '../components/Layout/SAPPageLayout';
import { SAPCard } from '../components/UI/SAPCard';
import { SAPButton } from '../components/UI/SAPButton';
import { SAPTable } from '../components/UI/SAPTable';
import { 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconFilter,
  IconShield,
  IconKey,
  IconMail,
  IconDotsVertical,
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconUsers,
  IconUserPlus
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../services/user';
import { User, UserRole, UserStatus, Permission } from '../types/auth';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserService.getUsers();
      setUsers(response.users || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: UserStatus) => {
    const statusConfig = {
      [UserStatus.ACTIVE]: { color: '#10B981', text: 'ACTIVE' },
      [UserStatus.INACTIVE]: { color: '#EF4444', text: 'INACTIVE' },
      [UserStatus.PENDING]: { color: '#F59E0B', text: 'PENDING' }
    };
    
    const config = statusConfig[status] || { color: '#6B7280', text: 'UNKNOWN' };
    return (
      <span 
        style={{ 
          backgroundColor: config.color + '20',
          color: config.color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}
      >
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      [UserRole.SUPER_ADMIN]: { color: '#8B5CF6', text: 'SUPER ADMIN' },
      [UserRole.ADMIN]: { color: '#3B82F6', text: 'ADMIN' },
      [UserRole.MANAGER]: { color: '#10B981', text: 'MANAGER' },
      [UserRole.EMPLOYEE]: { color: '#6B7280', text: 'EMPLOYEE' }
    };
    
    const config = roleConfig[role] || { color: '#6B7280', text: 'UNKNOWN' };
    return (
      <span 
        style={{ 
          backgroundColor: config.color + '20',
          color: config.color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}
      >
        {config.text}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      title: 'NAME',
      dataIndex: 'first_name',
      render: (value: string, record: User) => (
        <div>
          <div style={{ fontWeight: '600', color: 'var(--sap-text-primary)' }}>
            {record.first_name} {record.last_name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--sap-text-secondary)' }}>
            {record.email}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'ROLE',
      dataIndex: 'role',
      render: (value: UserRole) => getRoleBadge(value)
    },
    {
      key: 'status',
      title: 'STATUS',
      dataIndex: 'status',
      render: (value: UserStatus) => getStatusBadge(value)
    },
    {
      key: 'created',
      title: 'CREATED',
      dataIndex: 'created_at',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      dataIndex: 'id',
      render: (value: string, record: User) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <SAPButton
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit user:', record.id)}
          >
            <IconEdit size={16} />
          </SAPButton>
          <SAPButton
            variant="ghost"
            size="sm"
            onClick={() => console.log('Delete user:', record.id)}
          >
            <IconTrash size={16} />
          </SAPButton>
        </div>
      )
    }
  ];

  const pageActions = (
    <div style={{ display: 'flex', gap: '12px' }}>
      <SAPButton
        variant="outline"
        onClick={fetchUsers}
        loading={loading}
      >
        <IconRefresh size={16} />
        Refresh
      </SAPButton>
      <SAPButton
        variant="primary"
        onClick={() => console.log('Create user')}
      >
        <IconUserPlus size={16} />
        Create User
      </SAPButton>
    </div>
  );

  return (
    <SAPPageLayout
      title="User Management"
      subtitle="Manage system users, roles, and permissions"
      actions={pageActions}
    >
      <SAPCard>
        <div style={{ padding: '24px' }}>
          {/* Search and Filter Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <IconSearch 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--sap-text-secondary)'
                }} 
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid var(--sap-neutral-300)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--sap-bg-primary)',
                  color: 'var(--sap-text-primary)'
                }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
              style={{
                padding: '12px',
                border: '1px solid var(--sap-neutral-300)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--sap-bg-primary)',
                color: 'var(--sap-text-primary)',
                minWidth: '150px'
              }}
            >
              <option value="ALL">All Status</option>
              <option value={UserStatus.ACTIVE}>Active</option>
              <option value={UserStatus.INACTIVE}>Inactive</option>
              <option value={UserStatus.PENDING}>Pending</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--sap-bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--sap-neutral-200)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--sap-text-primary)' }}>
                {users.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--sap-text-secondary)' }}>
                Total Users
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--sap-bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--sap-neutral-200)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>
                {users.filter(u => u.status === UserStatus.ACTIVE).length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--sap-text-secondary)' }}>
                Active Users
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--sap-bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--sap-neutral-200)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#EF4444' }}>
                {users.filter(u => u.status === UserStatus.INACTIVE).length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--sap-text-secondary)' }}>
                Inactive Users
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Users Table */}
          <SAPTable
            columns={columns}
            data={filteredUsers}
            loading={loading}
            emptyText="No users found"
          />
        </div>
      </SAPCard>
    </SAPPageLayout>
  );
};

export default UsersPage;
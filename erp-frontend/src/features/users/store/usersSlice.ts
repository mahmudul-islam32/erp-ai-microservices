import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '../services/usersApi';
import {
  User,
  CreateUserData,
  UpdateUserData,
  UserFilters,
  Permission,
  RolePermissions,
  UserStatistics,
} from '../types';
import { toast } from 'sonner';

// State interface
interface UsersState {
  users: User[];
  selectedUser: User | null;
  rolePermissions: RolePermissions | null;
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
}

// Initial state
const initialState: UsersState = {
  users: [],
  selectedUser: null,
  rolePermissions: null,
  statistics: null,
  loading: false,
  error: null,
  filters: {
    skip: 0,
    limit: 50,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (filters?: UserFilters, { rejectWithValue }) => {
    try {
      const users = await usersApi.getAll(filters);
      return users;
    } catch (error: any) {
      toast.error('Failed to fetch users');
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await usersApi.getById(userId);
      return user;
    } catch (error: any) {
      toast.error('Failed to fetch user details');
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserData, { rejectWithValue }) => {
    try {
      const user = await usersApi.create(userData);
      toast.success('User created successfully');
      return user;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
      return rejectWithValue(error.response?.data?.detail || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, data }: { id: string; data: UpdateUserData }, { rejectWithValue }) => {
    try {
      const user = await usersApi.update(id, data);
      toast.success('User updated successfully');
      return user;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
      return rejectWithValue(error.response?.data?.detail || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await usersApi.delete(userId);
      toast.success('User deleted successfully');
      return userId;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete user');
    }
  }
);

export const updateUserPermissions = createAsyncThunk(
  'users/updateUserPermissions',
  async ({ userId, permissions }: { userId: string; permissions: Permission[] }, { rejectWithValue }) => {
    try {
      await usersApi.updatePermissions(userId, permissions);
      toast.success('Permissions updated successfully');
      return { userId, permissions };
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update permissions');
      return rejectWithValue(error.response?.data?.detail || 'Failed to update permissions');
    }
  }
);

export const fetchRolePermissions = createAsyncThunk(
  'users/fetchRolePermissions',
  async (_, { rejectWithValue }) => {
    try {
      const rolePermissions = await usersApi.getRolePermissions();
      return rolePermissions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch role permissions');
    }
  }
);

export const fetchUserStatistics = createAsyncThunk(
  'users/fetchUserStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const statistics = await usersApi.getStatistics();
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch statistics');
    }
  }
);

export const bulkDeleteUsers = createAsyncThunk(
  'users/bulkDeleteUsers',
  async (userIds: string[], { rejectWithValue }) => {
    try {
      await usersApi.bulkDelete(userIds);
      toast.success(`Successfully deleted ${userIds.length} user(s)`);
      return userIds;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete users');
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete users');
    }
  }
);

export const bulkUpdateUserStatus = createAsyncThunk(
  'users/bulkUpdateUserStatus',
  async ({ userIds, status }: { userIds: string[]; status: string }, { rejectWithValue, dispatch }) => {
    try {
      await usersApi.bulkUpdateStatus(userIds, status);
      toast.success(`Successfully updated status for ${userIds.length} user(s)`);
      // Refresh users list
      dispatch(fetchUsers());
      return { userIds, status };
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update user status');
      return rejectWithValue(error.response?.data?.detail || 'Failed to update user status');
    }
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<UserFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        skip: 0,
        limit: 50,
      };
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch user by ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedUser = action.payload;
    });
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create user
    builder.addCase(createUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users.push(action.payload);
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.users.findIndex((u) => (u.id || u._id) === (action.payload.id || action.payload._id));
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.selectedUser && (state.selectedUser.id || state.selectedUser._id) === (action.payload.id || action.payload._id)) {
        state.selectedUser = action.payload;
      }
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users = state.users.filter((u) => (u.id || u._id) !== action.payload);
      if (state.selectedUser && (state.selectedUser.id || state.selectedUser._id) === action.payload) {
        state.selectedUser = null;
      }
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user permissions
    builder.addCase(updateUserPermissions.fulfilled, (state, action) => {
      const { userId, permissions } = action.payload;
      const user = state.users.find((u) => (u.id || u._id) === userId);
      if (user) {
        user.permissions = permissions;
      }
      if (state.selectedUser && (state.selectedUser.id || state.selectedUser._id) === userId) {
        state.selectedUser.permissions = permissions;
      }
    });

    // Fetch role permissions
    builder.addCase(fetchRolePermissions.fulfilled, (state, action) => {
      state.rolePermissions = action.payload;
    });

    // Fetch user statistics
    builder.addCase(fetchUserStatistics.fulfilled, (state, action) => {
      state.statistics = action.payload;
    });

    // Bulk delete users
    builder.addCase(bulkDeleteUsers.fulfilled, (state, action) => {
      state.users = state.users.filter((u) => !action.payload.includes(u.id || u._id || ''));
    });
  },
});

export const { setFilters, clearFilters, setSelectedUser, clearError } = usersSlice.actions;

export default usersSlice.reducer;

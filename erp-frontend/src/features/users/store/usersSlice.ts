import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi, User, CreateUserData, UpdateUserData } from '../services/usersApi';
import { toast } from 'sonner';

interface UsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await usersApi.getAll();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
  }
});

export const fetchUserById = createAsyncThunk('users/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await usersApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
  }
});

export const createUser = createAsyncThunk('users/create', async (data: CreateUserData, { rejectWithValue }) => {
  try {
    const user = await usersApi.create(data);
    toast.success('User created successfully');
    return user;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to create user';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: UpdateUserData }, { rejectWithValue }) => {
    try {
      const user = await usersApi.update(id, data);
      toast.success('User updated successfully');
      return user;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update user';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteUser = createAsyncThunk('users/delete', async (id: string, { rejectWithValue }) => {
  try {
    await usersApi.delete(id);
    toast.success('User deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to delete user';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder.addCase(fetchUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch user by ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedUser = action.payload;
    });
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create user
    builder.addCase(createUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users.push(action.payload);
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update user
    builder.addCase(updateUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      state.selectedUser = action.payload;
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete user
    builder.addCase(deleteUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.users = state.users.filter((u) => u.id !== action.payload);
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;


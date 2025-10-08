import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customersApi, Customer, CreateCustomerData, UpdateCustomerData } from '../services/customersApi';
import { toast } from 'sonner';

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await customersApi.getAll();
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch customers');
  }
});

export const fetchCustomerById = createAsyncThunk('customers/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await customersApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch customer');
  }
});

export const createCustomer = createAsyncThunk('customers/create', async (data: CreateCustomerData, { rejectWithValue }) => {
  try {
    const customer = await customersApi.create(data);
    toast.success('Customer created successfully');
    return customer;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to create customer';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, data }: { id: string; data: UpdateCustomerData }, { rejectWithValue }) => {
    try {
      const customer = await customersApi.update(id, data);
      toast.success('Customer updated successfully');
      return customer;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update customer';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteCustomer = createAsyncThunk('customers/delete', async (id: string, { rejectWithValue }) => {
  try {
    await customersApi.delete(id);
    toast.success('Customer deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to delete customer';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.selectedCustomer = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearSelectedCustomer } = customersSlice.actions;
export default customersSlice.reducer;


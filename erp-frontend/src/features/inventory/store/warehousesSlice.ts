import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { warehousesApi, Warehouse, CreateWarehouseData, UpdateWarehouseData } from '../services/warehousesApi';
import { toast } from 'sonner';

interface WarehousesState {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WarehousesState = {
  warehouses: [],
  selectedWarehouse: null,
  isLoading: false,
  error: null,
};

export const fetchWarehouses = createAsyncThunk('warehouses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const data = await warehousesApi.getAll();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouses');
  }
});

export const fetchWarehouseById = createAsyncThunk('warehouses/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await warehousesApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouse');
  }
});

export const createWarehouse = createAsyncThunk('warehouses/create', async (data: CreateWarehouseData, { rejectWithValue }) => {
  try {
    const warehouse = await warehousesApi.create(data);
    toast.success('Warehouse created successfully');
    return warehouse;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create warehouse';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateWarehouse = createAsyncThunk(
  'warehouses/update',
  async ({ id, data }: { id: string; data: UpdateWarehouseData }, { rejectWithValue }) => {
    try {
      const warehouse = await warehousesApi.update(id, data);
      toast.success('Warehouse updated successfully');
      return warehouse;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update warehouse';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteWarehouse = createAsyncThunk('warehouses/delete', async (id: string, { rejectWithValue }) => {
  try {
    await warehousesApi.delete(id);
    toast.success('Warehouse deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to delete warehouse';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const warehousesSlice = createSlice({
  name: 'warehouses',
  initialState,
  reducers: {
    clearSelectedWarehouse: (state) => {
      state.selectedWarehouse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.warehouses = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWarehouseById.fulfilled, (state, action) => {
        state.selectedWarehouse = action.payload;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        state.warehouses.push(action.payload);
      })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        const index = state.warehouses.findIndex((w) => w._id === action.payload._id);
        if (index !== -1) {
          state.warehouses[index] = action.payload;
        }
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.warehouses = state.warehouses.filter((w) => w._id !== action.payload);
      });
  },
});

export const { clearSelectedWarehouse } = warehousesSlice.actions;
export default warehousesSlice.reducer;


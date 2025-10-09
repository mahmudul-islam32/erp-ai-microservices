import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersApi, SalesOrder, CreateOrderData, UpdateOrderData } from '../services/ordersApi';
import { toast } from 'sonner';

interface OrdersState {
  orders: SalesOrder[];
  selectedOrder: SalesOrder | null;
  isLoading: boolean;
  error: string | null;
  total: number;
}

const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
  total: 0,
};

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params: any = {}, { rejectWithValue }) => {
  try {
    return await ordersApi.getAll(params);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await ordersApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch order');
  }
});

export const createOrder = createAsyncThunk('orders/create', async (data: CreateOrderData, { rejectWithValue }) => {
  try {
    const order = await ordersApi.create(data);
    toast.success('Order created successfully');
    return order;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to create order';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateOrder = createAsyncThunk(
  'orders/update',
  async ({ id, data }: { id: string; data: UpdateOrderData }, { rejectWithValue }) => {
    try {
      const order = await ordersApi.update(id, data);
      toast.success('Order updated successfully');
      return order;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update order';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteOrder = createAsyncThunk('orders/delete', async (id: string, { rejectWithValue }) => {
  try {
    await ordersApi.delete(id);
    toast.success('Order deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.detail || 'Failed to delete order';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o.id !== action.payload);
      });
  },
});

export const { clearSelectedOrder } = ordersSlice.actions;
export default ordersSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsApi, Product, CreateProductData, UpdateProductData } from '../services/productsApi';
import { toast } from 'sonner';

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const data = await productsApi.getAll();
    // Ensure we return an array
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProductById = createAsyncThunk('products/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await productsApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
  }
});

export const createProduct = createAsyncThunk('products/create', async (data: CreateProductData, { rejectWithValue }) => {
  try {
    const product = await productsApi.create(data);
    toast.success('Product created successfully');
    return product;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create product';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }: { id: string; data: UpdateProductData }, { rejectWithValue }) => {
    try {
      const product = await productsApi.update(id, data);
      toast.success('Product updated successfully');
      return product;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk('products/delete', async (id: string, { rejectWithValue }) => {
  try {
    await productsApi.delete(id);
    toast.success('Product deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to delete product';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.selectedProduct = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearSelectedProduct } = productsSlice.actions;
export default productsSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesApi, Category, CreateCategoryData, UpdateCategoryData } from '../services/categoriesApi';
import { toast } from 'sonner';

interface CategoriesState {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    // Use main /categories endpoint (now fixed!)
    const data = await categoriesApi.getAll();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchCategoryById = createAsyncThunk('categories/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await categoriesApi.getById(id);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch category');
  }
});

export const createCategory = createAsyncThunk('categories/create', async (data: CreateCategoryData, { rejectWithValue }) => {
  try {
    const category = await categoriesApi.create(data);
    toast.success('Category created successfully');
    return category;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to create category';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, data }: { id: string; data: UpdateCategoryData }, { rejectWithValue }) => {
    try {
      const category = await categoriesApi.update(id, data);
      toast.success('Category updated successfully');
      return category;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update category';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteCategory = createAsyncThunk('categories/delete', async (id: string, { rejectWithValue }) => {
  try {
    await categoriesApi.delete(id);
    toast.success('Category deleted successfully');
    return id;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to delete category';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c._id !== action.payload);
      });
  },
});

export const { clearSelectedCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;


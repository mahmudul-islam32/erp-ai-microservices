import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import usersReducer from '../features/users/store/usersSlice';
import productsReducer from '../features/inventory/store/productsSlice';
import categoriesReducer from '../features/inventory/store/categoriesSlice';
import warehousesReducer from '../features/inventory/store/warehousesSlice';
import customersReducer from '../features/sales/store/customersSlice';
import ordersReducer from '../features/sales/store/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    products: productsReducer,
    categories: categoriesReducer,
    warehouses: warehousesReducer,
    customers: customersReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['your/action/type'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


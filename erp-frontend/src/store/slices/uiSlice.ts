import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NavigationState {
  activeMenu: string;
  expandedMenus: string[];
  sidebarCollapsed: boolean;
}

export interface UIState {
  navigation: NavigationState;
  theme: 'light' | 'dark';
  loading: boolean;
}

const initialState: UIState = {
  navigation: {
    activeMenu: 'HOME',
    expandedMenus: ['ANALYSIS'],
    sidebarCollapsed: false,
  },
  theme: 'light',
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveMenu: (state, action: PayloadAction<string>) => {
      state.navigation.activeMenu = action.payload;
    },
    toggleMenuExpansion: (state, action: PayloadAction<string>) => {
      const menu = action.payload;
      const index = state.navigation.expandedMenus.indexOf(menu);
      if (index > -1) {
        state.navigation.expandedMenus.splice(index, 1);
      } else {
        state.navigation.expandedMenus.push(menu);
      }
    },
    setExpandedMenus: (state, action: PayloadAction<string[]>) => {
      state.navigation.expandedMenus = action.payload;
    },
    toggleSidebar: (state) => {
      state.navigation.sidebarCollapsed = !state.navigation.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.navigation.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setActiveMenu,
  toggleMenuExpansion,
  setExpandedMenus,
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;

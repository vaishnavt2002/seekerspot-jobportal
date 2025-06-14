import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { refreshToken as refreshTokenApi } from '../../api/authApi';

// Global flag to prevent concurrent refresh attempts
let isRefreshing = false;

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    // Prevent concurrent refresh attempts
    if (isRefreshing) {
      return rejectWithValue('Refresh already in progress');
    }
    
    isRefreshing = true;
    try {
      const response = await refreshTokenApi();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    } finally {
      isRefreshing = false;
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false, 
  error: null,
  authChecked: false, // Add flag to track if initial auth check is done
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.authChecked = true;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      state.authChecked = true;
      state.isAuthenticated = false;
      state.user = null;
    },
    logoutAction(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.authChecked = true;
    },
    setUser(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.authChecked = true;
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshTokenThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshTokenThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = '';
        state.authChecked = true;
      });
  }
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logoutAction, 
  setUser,
  clearAuthError 
} = authSlice.actions;

export default authSlice.reducer;
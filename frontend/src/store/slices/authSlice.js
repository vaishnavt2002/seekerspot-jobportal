import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { refreshToken as refreshTokenApi } from '../../api/authApi';

export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshTokenApi();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false, 
  error: null,
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
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
      // Don't clear user or authenticated status here, 
      // as we might refresh the token first
    },
    logoutAction(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
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
        // We don't update the user here since we'll fetch the profile separately
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = 'Session expired';
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
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more reducers here as we build them
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

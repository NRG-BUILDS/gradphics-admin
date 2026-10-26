import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"

export type AdminUser = {
  id: string
  name: string
  email: string
  role: "admin"
}
type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AdminUser | null
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    accessToken: null,
    refreshToken: null,
    user: null,
  } as AuthState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string
        refreshToken: string
        user?: AdminUser
      }>,
    ) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      if (action.payload.user) state.user = action.payload.user
    },
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload
    },
    clearCredentials: () => ({
      accessToken: null,
      refreshToken: null,
      user: null,
    }),
  },
})

export const { setCredentials, setUser, clearCredentials } = authSlice.actions
export const store = configureStore({ reducer: { auth: authSlice.reducer } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

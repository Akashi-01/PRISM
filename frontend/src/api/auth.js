import { api } from './client'

// both return { user, token }
export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password }).then((res) => res.data.data)

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data.data)

export const getMe = () =>
  api.get('/auth/me').then((res) => res.data.data.user)
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const analyzePrompt = (prompt) =>
  api.post('/prompts/analyze', { prompt }).then((res) => res.data.data)

export const getPrompt = (id) =>
  api.get(`/prompts/${id}`).then((res) => res.data.data)

export const listPrompts = () =>
  api.get('/prompts').then((res) => res.data.data)
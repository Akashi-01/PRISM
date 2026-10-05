import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const analyzePrompt = (prompt) =>
  api.post('/prompts/analyze', { prompt }).then((res) => res.data.data)

export const getPrompt = (id) =>
  api.get(`/prompts/${id}`).then((res) => res.data.data)

export const listPrompts = () =>
  api.get('/prompts').then((res) => res.data.data)

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err.response) return 'Cannot reach the server. Is the backend running?'
  return err.response.data?.error || fallback
}
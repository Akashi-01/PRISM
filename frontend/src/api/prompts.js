import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 120000 })   // changed: added timeout

export const analyzePrompt = (prompt) =>
  api.post('/prompts/analyze', { prompt }).then((res) => res.data.data)

export const getPrompt = (id) =>
  api.get(`/prompts/${id}`).then((res) => res.data.data)

export const listPrompts = () =>
  api.get('/prompts').then((res) => res.data.data)

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (err.code === 'ECONNABORTED') return 'The request took too long. Please try again.' 
  if (!err.response) return 'Cannot reach the server. Is the backend running?'
  const data = err.response.data;
  const detail = data?.details && Object.values(data.details).flat()[0];                    
  return detail || data?.error || fallback
}
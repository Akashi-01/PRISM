import { api } from './client'

export const analyzePrompt = (prompt, provider) =>
  api.post('/prompts/analyze', { prompt, provider }).then((res) => res.data.data)

export const getPrompt = (id) =>
  api.get(`/prompts/${id}`).then((res) => res.data.data)

export const listPrompts = () =>
  api.get('/prompts').then((res) => res.data.data)

export const getStages = (id, history = false) =>
  api
    .get(`/prompts/${id}/stages`, { params: history ? { history: true } : {} })
    .then((res) => res.data.data)

// answers: [{ questionId, answer }] -> returns the updated session
export const submitAnswers = (id, answers) =>
  api.post(`/prompts/${id}/answers`, { answers }).then((res) => res.data.data)

// fromStage: "intent" | "requirements" | "missingInfo" | "redundancy" | "taskStructure" | "optimize"
export const rerunFromStage = (id, fromStage) =>
  api.post(`/prompts/${id}/rerun`, { fromStage }).then((res) => res.data.data)

export const getEvaluationOverview = () =>
  api.get('/evaluation/overview').then((res) => res.data.data)

export const evaluatePrompt = (id) =>
  api.post(`/prompts/${id}/evaluate`).then((res) => res.data.data)

export const getEvaluation = (id) =>
  api.get(`/prompts/${id}/evaluation`).then((res) => res.data.data)

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (err.code === 'ECONNABORTED') return 'The request took too long. Please try again.' 
  if (!err.response) return 'Cannot reach the server. Is the backend running?'
  const data = err.response.data;
  const detail = data?.details && Object.values(data.details).flat()[0];                    
  return detail || data?.error || fallback
}
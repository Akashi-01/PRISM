export const CRITERIA = [
  "relevance",
  "completeness",
  "instructionFollowing",
  "formatCorrectness",
] as const;

export const RUBRIC_TEXT = `Score each criterion from 1 to 5 (integers only).

relevance: does the response address what the task actually asks?
  1 = off-topic, 3 = partly on-topic with noticeable drift, 5 = fully on-topic

completeness: does it cover everything the task asks for?
  1 = misses most requirements, 3 = covers about half, 5 = covers every requirement

instructionFollowing: does it obey explicit constraints (length, tone, audience, steps, scope)?
  1 = ignores constraints, 3 = follows some, 5 = follows all

formatCorrectness: is the output in the form the task asks for (code, list, table, prose...)?
  1 = wrong form, 3 = partly right, 5 = exactly the requested form`;
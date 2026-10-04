export function computeSavings(before: number, after: number) {
  const tokensSaved = before - after;
  const percentSaved =
    before === 0 ? 0 : Math.round((tokensSaved / before) * 1000) / 10;
  return { tokensBefore: before, tokensAfter: after, tokensSaved, percentSaved };
}
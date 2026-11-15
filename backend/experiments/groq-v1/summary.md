# groq-v1

| experiment | provider | model | judge | testSetVersion | n | failed | meanSavedPct | medianSavedPct | qualityOriginal | qualityOptimized | qualityRetentionPct | wins | ties | losses | intentAccuracyPct | meanPipelineCostUSD | medianBreakEvenUses |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| groq-v1 | groq | openai/gpt-oss-120b | gemini | v1 | 40 | 0 | -37.9 | 17.9 | 4.99 | 4.66 | 93.5 | 0 | 34 | 6 | 62.5 | 0.000914 | 373.5 |

## By intent

| intent | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| coding | 7 | -55 | 4.96 | 4.21 | 84.9 |
| writing | 7 | -16.3 | 4.96 | 4.57 | 92.1 |
| analysis | 7 | -14.3 | 5 | 4.79 | 95.7 |
| explanation | 7 | -74.4 | 5 | 5 | 100 |
| data | 6 | -44.5 | 5 | 4.58 | 91.7 |
| other | 6 | -21.1 | 5 | 4.83 | 96.7 |

## By style

| tag | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| verbose | 12 | 30.3 | 5 | 4.79 | 95.8 |
| concise | 9 | -64.3 | 5 | 4.42 | 88.3 |
| vague | 6 | -264.4 | 4.96 | 4.71 | 95 |
| redundant | 7 | 34.3 | 4.96 | 4.57 | 92.1 |
| structured | 6 | 7.8 | 5 | 4.83 | 96.7 |

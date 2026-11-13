# groq-v1

| experiment | provider | model | judge | testSetVersion | n | failed | meanSavedPct | medianSavedPct | qualityOriginal | qualityOptimized | qualityRetentionPct | wins | ties | losses | intentAccuracyPct | meanPipelineCostUSD | medianBreakEvenUses |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| groq-v1 | groq | openai/gpt-oss-120b | gemini | v1 | 40 | 0 | -37.9 | 17.9 | 5 | 4.62 | 92.4 | 0 | 32 | 8 | 62.5 | 0.000914 | 373.5 |

## By intent

| intent | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| coding | 7 | -55 | 5 | 4.18 | 83.6 |
| writing | 7 | -16.3 | 5 | 4.61 | 92.1 |
| analysis | 7 | -14.3 | 5 | 4.79 | 95.7 |
| explanation | 7 | -74.4 | 5 | 5 | 100 |
| data | 6 | -44.5 | 5 | 4.92 | 98.3 |
| other | 6 | -21.1 | 5 | 4.21 | 84.2 |

## By style

| tag | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| verbose | 12 | 30.3 | 5 | 4.81 | 96.3 |
| concise | 9 | -64.3 | 5 | 4.17 | 83.3 |
| vague | 6 | -264.4 | 5 | 4.71 | 94.2 |
| redundant | 7 | 34.3 | 5 | 4.61 | 92.1 |
| structured | 6 | 7.8 | 5 | 4.83 | 96.7 |

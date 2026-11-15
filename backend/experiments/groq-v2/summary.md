# groq-v2

| experiment | provider | model | judge | testSetVersion | n | failed | meanSavedPct | medianSavedPct | qualityOriginal | qualityOptimized | qualityRetentionPct | wins | ties | losses | intentAccuracyPct | meanPipelineCostUSD | medianBreakEvenUses |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| groq-v2 | groq | openai/gpt-oss-120b | gemini | v1 | 40 | 0 | 18.9 | 14.6 | 4.99 | 4.99 | 100 | 0 | 40 | 0 | 65 | 0.000912 | 331 |

## By intent

| intent | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| coding | 7 | 17.8 | 4.96 | 4.96 | 100 |
| writing | 7 | 18.7 | 5 | 5 | 100 |
| analysis | 7 | 18.4 | 5 | 5 | 100 |
| explanation | 7 | 21.5 | 5 | 5 | 100 |
| data | 6 | 11.1 | 5 | 5 | 100 |
| other | 6 | 25.5 | 5 | 5 | 100 |

## By style

| tag | n | savedPct | qualityOriginal | qualityOptimized | retentionPct |
|---|---|---|---|---|---|
| verbose | 12 | 36.5 | 5 | 5 | 100 |
| concise | 9 | 1.7 | 5 | 5 | 100 |
| vague | 6 | 0 | 5 | 5 | 100 |
| redundant | 7 | 35.9 | 4.96 | 4.96 | 100 |
| structured | 6 | 8.2 | 5 | 5 | 100 |

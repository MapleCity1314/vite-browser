# Network Regression

## What This Capability Is For

Use `network-regression` when the visible problem is mainly about requests, payloads, auth, cookies, CORS, or wrong UI data.

Typical prompts:

- "the data is wrong"
- "the response is empty"
- "this started returning 401"
- "the request looks right but the page is still wrong"

## What Humans Should Expect

This capability isolates request/response mismatches quickly so you can separate frontend request-building bugs from backend response issues.

## Best Practices For AI

- Prefer this pack when the strongest symptom is bad or missing data.
- Inspect specific failing requests instead of vaguely summarizing the whole network list.
- Cross-check request evidence against current UI state and logs.
- Switch to runtime diagnostics if the request failures only appear after a hot update or reload loop.

## Standard Sequence

```bash
vite-browser open <url>
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state-probe>'
vite-browser screenshot
```

## Analysis Checklist

For each suspicious request:

1. URL and method correct?
2. Status and response body expected?
3. Request headers or body complete?
4. CORS, auth, or cookie mismatch?
5. UI state consistent with the response?

## Expected Output

Return:

1. failing request index and endpoint
2. concrete mismatch
3. likely ownership: frontend request build or backend response
4. confidence level
5. exact retest sequence

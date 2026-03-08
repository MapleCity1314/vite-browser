---
name: vite-browser-network-regression
description: >-
  Focused workflow for API/data regressions in Vite apps using vite-browser
  network inspection. Use whenever users report wrong data, failed requests,
  inconsistent payloads, or intermittent API behavior during dev.
---

# vite-browser-network-regression

Use this skill to isolate request/response regressions quickly.

## Workflow

1. Open page and reproduce action.
2. List network traffic and identify suspicious entries (4xx/5xx/FAIL/slow).
3. Inspect target request in detail.
4. Correlate with UI state and console errors.

## Commands

```bash
vite-browser open <url>
vite-browser errors
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state-probe>'
vite-browser screenshot
```

## Analysis checklist

For each failed/suspicious request:

1. URL and method correct?
2. Status and response body expected?
3. Request headers/body complete?
4. CORS/auth/cookie mismatch?
5. UI state consistent with response?

## Output format

Always include:

1. Failing request index and endpoint
2. Concrete mismatch (request or response)
3. Likely ownership (frontend request build vs backend response)
4. Exact re-test command sequence


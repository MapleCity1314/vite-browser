# Network Regression

## When to use

Use `network-regression` when the visible problem is about **requests, payloads, auth, or wrong data**:

- _"The data is wrong"_
- _"The response is empty"_
- _"This started returning 401"_
- _"The request looks right but the page is still wrong"_

## Sequence

```bash
vite-browser open <url>
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state-probe>'
vite-browser screenshot
```

## Analysis checklist

For each suspicious request, check:

1. **URL and method** — correct endpoint?
2. **Status and body** — expected response?
3. **Request headers/body** — complete and correct?
4. **CORS / auth / cookies** — any mismatch?
5. **UI consistency** — does the UI match the response?

## When to switch

If request failures only appear after a hot update or reload loop, the real issue may be runtime instability. Switch to [Runtime Diagnostics](/capabilities/runtime-diagnostics).

## Expected output

1. Failing request index and endpoint
2. Concrete mismatch description
3. Likely ownership: frontend request build or backend response
4. Confidence level
5. Exact retest sequence

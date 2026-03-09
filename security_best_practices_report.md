# Security Best Practices Report

## Executive Summary

This report originally identified three issues: cross-site WebSocket session hijacking, radio metadata SSRF, and an open cross-origin media proxy. All three have now been addressed in code with exact-origin enforcement via `CHGRID_HOST_ORIGIN`, SSRF-safe radio URL validation, and same-origin-only access for the PHP media proxy.

## Critical Findings

### SEC-001: Cross-site WebSocket hijacking via cookie-based session resume without Origin validation

Impact: A malicious website can open a WebSocket to the Chat Grid server from a victim's browser, inherit the victim's session cookie, and perform authenticated actions as that user.

Evidence:
- The server reads the session token directly from the WebSocket handshake cookie in [server.py](/home/jjm/code/chgrid/server/app/server.py#L329) and [server.py](/home/jjm/code/chgrid/server/app/server.py#L339).
- The WebSocket client is auto-authenticated from that cookie before any application message is sent in [server.py](/home/jjm/code/chgrid/server/app/server.py#L1387) through [server.py](/home/jjm/code/chgrid/server/app/server.py#L1392).
- There is no `Origin` validation in the handshake path around [server.py](/home/jjm/code/chgrid/server/app/server.py#L1380).

Why this matters:
- Browser WebSockets are not protected by normal same-origin read restrictions once the server accepts the connection.
- Because the app uses cookie-based session resume, a third-party origin can potentially establish an authenticated socket unless the server rejects unexpected origins.

Implemented fix:
- The server now requires `CHGRID_HOST_ORIGIN` and passes that exact origin into the WebSocket handshake allowlist.
- Browser sockets with missing or mismatched `Origin` are rejected before the application session resume path runs.

## High Findings

### SEC-002: Radio metadata polling creates server-side request forgery from user-controlled `streamUrl`

Impact: An authenticated user who can create or edit a radio item can cause the server to fetch attacker-chosen URLs, including internal network targets.

Evidence:
- Radio item validation accepts `streamUrl` with only length normalization in [validator.py](/home/jjm/code/chgrid/server/app/items/types/radio_station/validator.py#L11) through [validator.py](/home/jjm/code/chgrid/server/app/items/types/radio_station/validator.py#L18).
- The server later fetches that URL with `urllib.request.urlopen` in [server.py](/home/jjm/code/chgrid/server/app/server.py#L673) through [server.py](/home/jjm/code/chgrid/server/app/server.py#L700).
- Any enabled radio with a listener in range is polled in [server.py](/home/jjm/code/chgrid/server/app/server.py#L703) through [server.py](/home/jjm/code/chgrid/server/app/server.py#L717).

Why this matters:
- This is a classic SSRF primitive.
- A user does not need browser access to the target; the server makes the request.
- Internal services, metadata endpoints, localhost services, or other private hosts are not blocked here.

Implemented fix:
- Radio `streamUrl` values are now validated server-side as public `http`/`https` URLs before they are saved.
- Metadata polling revalidates and manually follows redirect hops so a safe initial URL cannot redirect into a blocked target.

## Medium Findings

### SEC-003: Optional PHP media proxy is an open cross-origin proxy when no allowlist is configured

Impact: If deployed as-is without `CHGRID_MEDIA_PROXY_ALLOWLIST`, third parties can use the site as a public cross-origin proxy to arbitrary public hosts.

Evidence:
- The proxy explicitly enables wildcard CORS in [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L380) through [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L382).
- It accepts a user-supplied `url` parameter in [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L393) through [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L401).
- The hostname allowlist is optional, not required, in [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L399) through [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L401).
- Redirect resolution and streaming then proceed for the target URL in [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L320) through [media_proxy.php](/home/jjm/code/chgrid/deploy/php/media_proxy.php#L377).

Why this matters:
- Even with private/reserved IP blocking, this can still be abused for bandwidth consumption, origin laundering, and relaying requests to arbitrary public endpoints.
- Because CORS is `*`, other websites can read proxy responses directly from browsers.

Implemented fix:
- The proxy now requires `CHGRID_HOST_ORIGIN`.
- `Access-Control-Allow-Origin` is restricted to that exact origin, and mismatched request origins are rejected.
- Upstream media hosts remain unrestricted, preserving the intended relay behavior for arbitrary public media sources.

## Lower-Risk Notes

- I did not find obvious client-side DOM XSS in the current UI paths I sampled. The app mostly builds DOM with `textContent` and node creation, and the `innerHTML` uses I saw were clearing containers rather than injecting untrusted markup.
- The client no longer stores session tokens in `localStorage`; session persistence is now moved to an `HttpOnly` cookie path, which is the right direction.
- TLS posture appears intentionally gated by config, and I did not treat local insecure WebSocket support as a finding.

## Residual Risks / Gaps

- I did not perform dependency CVE triage across `npm` and Python package locks in this pass.
- I did not run server-side tests or dynamic attack simulations; this was a code audit.
- The PHP proxy is deploy-time optional, but it is part of the repo and worth treating as production-facing if used.

# Flowya App — AI Coding Instructions (Copilot)

## Project Overview

**Flowya** is a cross-platform React Native / Expo application (iOS, Android, Web) using **Expo Router** (file-based routing) and **TypeScript**. Backend uses **Supabase**.

## Operating Rules

- Prefer **small, safe changes** with clear intent.
- Keep code **map-first** (Apple Maps vibe), mobile-web first.
- Avoid introducing new libraries unless explicitly required.
- Do not “invent” architecture: follow existing patterns in this repo.

## Routing (Expo Router)

- Routes are defined by the `app/` directory.
- Root layout: `app/_layout.tsx`
- Tabs are under `app/(tabs)/`

## Styling & UI

- Use existing components in `components/` and design-system components when available.
- Prefer consistent spacing/typography; avoid ad-hoc styles unless necessary.
- Keep UI sharp (no unnecessary blur/glow effects unless explicitly requested).

## Data & Supabase

- Supabase tables in use: `spots`, `pins`, `feedback`.
- Assume RLS is enabled; policies must be intentional and minimal.
- Do not loosen security policies by default. If a policy must be permissive for MVP, document it in `docs/ops/OPEN_LOOPS.md`.

## Code Quality

- TypeScript: keep types explicit for public APIs (hooks/components).
- No dead code / no unused exports.
- If you change behavior, add a quick note in the relevant docs/bitácora entry.

## Dev Commands

- Install: `npm install`
- Start: `npx expo start`
- Lint (if configured): `npm run lint`

## Output Expectations

When proposing changes, always provide:

1. What you changed (1–3 bullets)
2. Why it’s safe
3. How to test (web mobile + keyboard)

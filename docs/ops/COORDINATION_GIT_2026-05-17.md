# Coordinación Git — 2026-05-17

Generado por auditoría automática. **No mergear código desde este branch**; solo registro operativo.

## Estado remoto (`origin/main`)

- HEAD: `cdcda1f` — Merge PR #186 (privacy route rewrite).

## PRs abiertos relevantes

| PR | Rama | Título | Archivos | Mergeable | Notas |
|----|------|--------|----------|-----------|-------|
| 188 | `codex/supabase-phase-0-registry-001` | Fase 0 Supabase docs/registry | 7 (docs + script) | MERGEABLE, CLEAN | Sin solapamiento con 189 |
| 189 | `codex/web-phase-1-explore-geo-search-001` | Web geo search Explore | 2 TSX | MERGEABLE, CLEAN | Independiente de 188 |
| 190 | `feat/privacy-ios-policy` | iOS privacy policy route | 5 | MERGEABLE, UNSTABLE (checks) | **Otro agente**; no es 188/189 |
| 187 | `cursor/critical-correctness-bugs-31d4` | fail-closed geo marks | 3 | DRAFT, UNKNOWN | Paralelo, no bloqueante |

Orden recomendado en GitHub: **188 → 189 → 190** (docs primero; web después; legal cuando checks en verde).

## `main` local divergente

- `main` vs `origin/main`: **+18 / -3** (divergidos).
- Commits solo en remoto: merge #186 + fixes Vercel privacy.
- Commits solo en local `main`: trabajo native/flow/docs (lista en `git log origin/main..main`).
- **Preservación:** rama local `backup/local-main-2026-05-17` apunta al `main` previo a limpieza.

## Stashes (no eliminar sin revisar)

- `stash@{0}`: `app/_layout.tsx`, `vercel.json` (privacy-ios) — solapa con PR 190.
- `stash@{1}`: `lib/map-core/constants.ts` (wip worktree 2026-02-27).

## Working tree

- En auditoría: checkout `main`, limpio; archivos `privacy-ios` **no** untracked en `main` (viven en PR 190).

## Limpieza segura sugerida (manual)

```bash
git fetch origin --prune
git checkout main
# Opcional: conservar ya hecho backup/local-main-2026-05-17
git pull --rebase origin main   # o merge; resolver si choca con commits locales
# Tras merge de PRs en GitHub:
git pull origin main
git branch -d codex/supabase-phase-0-registry-001 codex/web-phase-1-explore-geo-search-001  # si merged
git push origin --delete <rama>  # solo si el usuario lo pide
```

## Conflictos entre PRs

- 188 ∩ 189: **ningún archivo común**.
- 190 ∩ 189/188: **sin solapamiento de rutas** con 189; 190 toca layout/vercel (distinto de 188 docs).

## Política

- No `git push --force` a `main`.
- No `git stash drop` sin `git stash show -p stash@{N}`.

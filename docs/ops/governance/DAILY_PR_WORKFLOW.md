# DAILY_PR_WORKFLOW — 1 PR por día (sin perder control)

## Objetivo

Tener **un solo PR diario** a `main`, pero poder:

- integrar solo lo que funciona,
- sacar del alcance lo que se rompe,
- mantener trazabilidad (bitácora + commits).

---

## Estrategia recomendada (topic branches + cherry-pick)

### 1) Arranque del día

- `git checkout main`
- `git pull`
- `git checkout -b feat/day-YYYY-MM-DD-<tema>`

### 2) Por cada micro-scope

Crear una rama por micro-scope:

- `git checkout -b feat/<area>-ms01-<slug>`
- trabajar, commits pequeños
- push de esa rama (opcional, si quieres backup / CI)

### 3) Integración segura (solo lo que sirve)

Volver a la rama diaria e integrar:

- `git checkout feat/day-YYYY-MM-DD-<tema>`
- `git cherry-pick <commit(s) de la ms>`
  (o merge si fue 1 commit limpio)

Si una ms está rota:

- NO se cherry-pickea.
- Queda viva como branch para mañana o se abandona.

### 4) PR del día

- push de rama diaria
- abrir PR (solo uno) → merge a `main`

### 5) Cierre

- bitácora: qué entró / qué se sacó
- CURRENT_STATE: snapshot real
- borrar ramas locales que ya se mergearon

---

## Alternativa (solo commits en la rama diaria)

Úsala si estás trabajando ultra rápido, pero exige disciplina:

- Cada micro-scope = 1 commit autocontenido
- Si algo se rompe: `git revert <commit>` antes del PR
- No mezclar cambios “a medias” en el mismo commit

---

## Regla clave

**Nada entra al PR diario si no está estable.**
El “alcance del día” se controla con cherry-picks (o reverts), no con fe.

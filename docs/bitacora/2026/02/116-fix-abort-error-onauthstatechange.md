# Bitácora 116 — Fix AbortError en onAuthStateChange

**Fecha:** 2026-02-22

## Objetivo

Resolver `AbortError: signal is aborted without reason` al cargar Explore (web dev). El error provenía de `navigatorLock` / `_acquireLock` dentro del callback de `supabase.auth.onAuthStateChange`.

## Causa

Supabase auth-js usa Web Locks API internamente. Ejecutar operaciones **async** (como `supabase.auth.getUser()`) dentro del callback de `onAuthStateChange` provoca race conditions y AbortError. Bug conocido: [supabase/auth-js#762](https://github.com/supabase/auth-js/issues/762).

## Solución

Usar solo el argumento `session` del callback (síncrono), sin llamar a `getUser()` ni otras operaciones async dentro del handler.

**Antes:**
```ts
supabase.auth.onAuthStateChange(() => {
  updateAuth(); // async: getUser()
});
```

**Después:**
```ts
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    setIsAuthUser(!session.user.is_anonymous);
  } else {
    setIsAuthUser(false);
  }
});
```

La carga inicial sigue usando `getUser()` fuera del callback (en el mismo useEffect, antes de suscribirse).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `components/explorar/MapScreenVNext.tsx` | Callback síncrono con session |
| `components/explorar/MapScreenV0.tsx` | Idem |
| `app/spot/[id].web.tsx` | Idem (SIGNED_IN + session) |
| `app/spot/edit/[id].web.tsx` | Idem |
| `app/create-spot/index.web.tsx` | Idem |

/**
 * Feature flags (Phase A scaffolding).
 * Defaults are OFF to avoid behavior changes before full rollout.
 */

function envEnabled(name: string): boolean {
  return (process.env[name] ?? '').toLowerCase() === 'true';
}

export const featureFlags = {
  linkOnEditSave: envEnabled('EXPO_PUBLIC_FF_LINK_ON_EDIT_SAVE'),
  hideLinkedUnsaved: envEnabled('EXPO_PUBLIC_FF_HIDE_LINKED_UNSAVED'),
  flowyaPinMakiIcon: envEnabled('EXPO_PUBLIC_FF_FLOWYA_PIN_MAKI_ICON'),
} as const;

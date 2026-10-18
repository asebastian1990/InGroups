import { app } from '@microsoft/teams-js';

/**
 * WO-8 / MS Issue #5: dismiss Teams' native tab loading shell via app.notifySuccess().
 * Set to false to revert behavior without removing call sites (emergency rollback).
 */
export const TEAMS_NATIVE_LOADING_NOTIFY = true;

let successSent = false;
let failureSent = false;

/** Test-only reset; not used in production paths. */
export function resetTeamsNativeLoadingNotifyState(): void {
  successSent = false;
  failureSent = false;
}

/** Call once when tab content is ready (after auth bootstrap / first meaningful UI). */
export function notifyTeamsContentSuccess(): void {
  if (!TEAMS_NATIVE_LOADING_NOTIFY || successSent || failureSent) return;
  try {
    app.notifySuccess();
    successSent = true;
  } catch (err) {
    console.warn('[teams] app.notifySuccess failed:', err);
  }
}

/** Non-recoverable fatal only (e.g. Teams SDK init failed). Do not use for SSO/guest fallback. */
export function notifyTeamsContentFailure(message?: string): void {
  if (!TEAMS_NATIVE_LOADING_NOTIFY || failureSent) return;
  try {
    app.notifyFailure({
      reason: app.FailedReason.Other,
      message: message ?? 'Unable to load InGroups.',
    });
    failureSent = true;
  } catch (err) {
    console.warn('[teams] app.notifyFailure failed:', err);
  }
}

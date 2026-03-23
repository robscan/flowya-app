/**
 * Persistencia local: localStorage en web, AsyncStorage en iOS/Android.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export function isWebLocalStorageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

export function getItemSync(key: string): string | null {
  if (Platform.OS === "web" && isWebLocalStorageAvailable()) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === "web" && isWebLocalStorageAvailable()) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return AsyncStorage.getItem(key);
}

export function setItem(key: string, value: string): void {
  if (Platform.OS === "web" && isWebLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  void AsyncStorage.setItem(key, value);
}

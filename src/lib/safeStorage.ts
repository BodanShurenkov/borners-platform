'use client';

const LEGACY_KEYS_TO_REMOVE = [
  'borners_group_platform_state_ru_v1',
  'borners_group_platform_state_ru_v2',
  'borners_group_platform_state_ru_v3',
  'borners_group_platform_state_ru_v4',
  'borners_group_platform_state_ru_v5',
  'borners_group_platform_state_ru_v6',
  'borners_group_platform_state_ru_v7',
  'borners_group_platform_state_ru_v8',
  'borners_strategy_platform_v1',
  'borners_strategy_platform_v2',
  'borners_strategy_platform_v3',
  'borners_strategy_platform_v4',
  'borners_strategy_platform_v5',
];

let legacyCleaned = false;

export function cleanupLegacyStorageKeys(): void {
  if (typeof window === 'undefined' || legacyCleaned) return;
  legacyCleaned = true;
  try {
    for (const k of LEGACY_KEYS_TO_REMOVE) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

/**
 * Рекурсивно уменьшает слишком тяжёлые base64-строки (неcжатые фото/аудио),
 * чтобы JSON гарантированно помещался в квоту localStorage (5 МБ) и не блокировал сохранение/удаление карточек.
 */
export function stripOversizedDataUrls<T>(value: T, maxDataUrlLen = 95_000): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.startsWith('data:image/') && value.length > maxDataUrlLen) {
      return 'images/products/borners-core-modal.svg' as unknown as T;
    }
    if (value.startsWith('data:audio/') && value.length > maxDataUrlLen) {
      return '' as unknown as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripOversizedDataUrls(item, maxDataUrlLen)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripOversizedDataUrls(v, maxDataUrlLen);
    }
    return out as T;
  }
  return value;
}

/**
 * Надёжное сохранение в localStorage:
 * 1) Очищает устаревшие ключи прошлых версий
 * 2) Сначала вызывает removeItem(key), чтобы браузер освободил старый буфер памяти перед записью нового
 * 3) При переполнении квоты (QuotaExceededError) автоматически поджимает тяжёлые base64-вложения и повторяет запись
 */
export function safeSetStorageJson<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;
  cleanupLegacyStorageKeys();

  try {
    const raw = JSON.stringify(data);
    // Если сериализованный объект слишком большой (> 1.8 МБ), сразу облегчаем тяжёлые base64-картинки
    const payload =
      raw.length > 1_800_000
        ? JSON.stringify(stripOversizedDataUrls(data, 70_000))
        : raw;

    window.localStorage.removeItem(key);
    window.localStorage.setItem(key, payload);
    return true;
  } catch {
    try {
      // Экстренный фоллбэк: убираем все тяжёлые data: URL (> 25 КБ), чтобы структура карточек 100% сохранилась
      const slim = stripOversizedDataUrls(data, 25_000);
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, JSON.stringify(slim));
      return true;
    } catch (err2) {
      console.error(`safeSetStorageJson failed for key "${key}":`, err2);
      return false;
    }
  }
}

/**
 * Надёжное чтение из localStorage с автоматическим лечением переполненных записей.
 */
export function safeGetStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  cleanupLegacyStorageKeys();

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    // Если в localStorage уже лежала раздутая запись (> 1.5 МБ), сразу лечим и перезаписываем её
    if (raw.length > 1_500_000) {
      const healed = stripOversizedDataUrls(parsed, 70_000);
      safeSetStorageJson(key, healed);
      return healed;
    }
    return parsed;
  } catch {
    return null;
  }
}

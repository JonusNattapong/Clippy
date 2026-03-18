export function normalizeTelegramChatIds(value?: string): string[] {
  return (value || "")
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function containsSensitiveNotificationContent(message: string): boolean {
  const patterns = [
    /sk-[A-Za-z0-9_-]{16,}/,
    /sk-ant-[A-Za-z0-9_-]{16,}/,
    /AIza[0-9A-Za-z_-]{16,}/,
    /api[_ -]?key\s*[:=]\s*\S+/i,
    /password\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
    /bearer\s+[A-Za-z0-9._-]+/i,
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
  ];

  return patterns.some((pattern) => pattern.test(message));
}

export function isWithinQuietHours(
  now: Date,
  start?: string,
  end?: string,
): boolean {
  if (!start || !end) {
    return false;
  }

  const startMinutes = parseHourMinute(start);
  const endMinutes = parseHourMinute(end);
  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function truncateTelegramMessage(message: string, maxLength = 3500) {
  const trimmed = message.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function parseHourMinute(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export const USER_LOGOUT_PREFIX = 'user_logout_at:';

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

const DEFAULT_TTL_SECONDS = 86400;

export function parseDurationToSeconds(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(value.trim());

  if (!match) {
    return DEFAULT_TTL_SECONDS;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 's';

  return amount * UNIT_SECONDS[unit];
}

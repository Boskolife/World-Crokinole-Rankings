import { fromZonedTime, toZonedTime } from "date-fns-tz";

export function localInTimezoneToUtc(
    localDateTimeStr: string,
    timezone: string
): string {
    const d = new Date(localDateTimeStr);
    return fromZonedTime(d, timezone).toISOString();
}

export function utcToLocalDateTime(isoUtc: string, timezone: string): string {
    const d = new Date(isoUtc);
    const zoned = toZonedTime(d, timezone);
    const y = zoned.getFullYear();
    const m = String(zoned.getMonth() + 1).padStart(2, "0");
    const day = String(zoned.getDate()).padStart(2, "0");
    const h = String(zoned.getHours()).padStart(2, "0");
    const min = String(zoned.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
}

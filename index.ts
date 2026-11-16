import { calendar } from "./calendar.ts";

type CalendarEvent = (typeof calendar.events)[number];

const TIMEZONE = calendar.timezone;
const OUTPUT_PATH = "calendar.ics";
const PRODID = "-//RCJNSW//Calendar//EN";
const CALENDAR_NAME = "RCJNSW Dates";

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIMEZONE}`,
  "X-LIC-LOCATION:Australia/Sydney",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+1000",
  "TZOFFSETTO:+1100",
  "TZNAME:AEDT",
  "DTSTART:19701004T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+1100",
  "TZOFFSETTO:+1000",
  "TZNAME:AEST",
  "DTSTART:19700405T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const localFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localParts(date: Date): LocalParts {
  const parts = localFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((candidate) => candidate.type === type);
    if (!part) throw new Error(`Missing ${type} in formatted date`);
    return Number(part.value);
  };

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatLocal(date: Date): string {
  const { year, month, day, hour, minute, second } = localParts(date);
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}${pad(second)}`;
}

function formatDate(date: Date): string {
  const { year, month, day } = localParts(date);
  return `${year}${pad(month)}${pad(day)}`;
}

function formatUtc(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isAllDay(start: Date, end: Date): boolean {
  const startParts = localParts(start);
  const endParts = localParts(end);

  return (
    startParts.hour === 0 &&
    startParts.minute === 0 &&
    startParts.second === 0 &&
    endParts.hour === 23 &&
    endParts.minute === 59
  );
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

const encoder = new TextEncoder();

function foldLine(line: string): string {
  const chunks: string[] = [];
  let chunk = "";
  let chunkBytes = 0;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const limit = chunks.length === 0 ? 75 : 74;

    if (chunkBytes + characterBytes > limit) {
      chunks.push(chunk);
      chunk = "";
      chunkBytes = 0;
    }

    chunk += character;
    chunkBytes += characterBytes;
  }

  if (chunk.length > 0) chunks.push(chunk);

  return chunks.join("\r\n ");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uid(event: CalendarEvent): string {
  const slug = slugify(event.title) || "event";
  return `${slug}-${formatLocal(event.schedule.start)}@rcjnsw`;
}

function buildEvent(event: CalendarEvent, timestamp: string): string[] {
  const { start, end, rrule } = event.schedule;
  const allDay = isAllDay(start, end);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid(event)}`,
    `DTSTAMP:${timestamp}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDate(start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(addDays(end, 1))}`);
  } else {
    lines.push(`DTSTART;TZID=${TIMEZONE}:${formatLocal(start)}`);
    lines.push(`DTEND;TZID=${TIMEZONE}:${formatLocal(end)}`);
  }

  if (rrule) lines.push(`RRULE:${rrule}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push(`STATUS:${(event.status ?? "confirmed").toUpperCase()}`);

  for (const exception of event.exceptions ?? []) {
    if (exception.status !== "cancelled" || !exception.start) continue;

    const occurrence = new Date(exception.start);
    lines.push(
      allDay
        ? `EXDATE;VALUE=DATE:${formatDate(occurrence)}`
        : `EXDATE;TZID=${TIMEZONE}:${formatLocal(occurrence)}`,
    );
  }

  lines.push("END:VEVENT");
  return lines;
}

const timestamp = formatUtc(new Date());
const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  `PRODID:${PRODID}`,
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  `NAME:${CALENDAR_NAME}`,
  `X-WR-CALNAME:${CALENDAR_NAME}`,
  `X-WR-TIMEZONE:${TIMEZONE}`,
  ...VTIMEZONE,
];

for (const event of calendar.events) {
  lines.push(...buildEvent(event, timestamp));
}

lines.push("END:VCALENDAR");

const ics = `${lines.map(foldLine).join("\r\n")}\r\n`;
await Bun.write(OUTPUT_PATH, ics);

console.log(`Wrote ${OUTPUT_PATH} with ${calendar.events.length} events.`);

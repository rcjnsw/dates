type EventType = "recurring" | "one-off";

type EventStatus = "confirmed" | "cancelled";

interface EventSchedule {
  start: Date;
  end: Date;
  rrule?: string; // iCalendar RRULE
}

interface EventException {
  status: "cancelled" | "rescheduled";
  start?: string; // New start datetime
  end?: string; // New end datetime
  location?: string;
  description?: string;
}

interface CalendarEvent {
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  schedule: EventSchedule;
  exceptions?: EventException[];
  status?: EventStatus;
  url?: string;
}

interface Calendar {
  timezone: "Australia/Sydney";
  events: CalendarEvent[];
}

export const calendar: Calendar = {
  timezone: "Australia/Sydney",
  events: [
    {
      type: "recurring",
      title: "RCJNSW Committee Meeting",
      description:
        "Standard committee meeting, on the first Monday of every month. Minutes: https://docs.google.com/document/d/1t1bd7x7UcOQYOph8dDTdg42b-UYlWm_Gy6mxXRH-aS8/edit?tab=t.0",
      location: "Online",
      schedule: {
        start: new Date("2026-12-07T20:00:00+11:00"),
        end: new Date("2026-12-07T21:30:00+11:00"),
        rrule: "FREQ=MONTHLY;BYDAY=1MO",
      },
      exceptions: [
        {
          status: "cancelled",
          start: "2027-01-04T20:00:00+11:00",
        },
      ],
    },
    {
      type: "one-off",
      title: "RCJNSW Annual General Meeting",
      location: "Online",
      schedule: {
        start: new Date("2026-12-02T00:00:00+11:00"),
        end: new Date("2026-12-02T23:59:59+11:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJNSW Planning Day",
      schedule: {
        start: new Date("2027-02-06T00:00:00+11:00"),
        end: new Date("2027-02-06T23:59:59+11:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJA National Launch Day",
      location: "Online",
      schedule: {
        start: new Date("2027-02-22T19:30:00+11:00"),
        end: new Date("2027-02-22T21:00:00+11:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJNSW Teacher Workshop",
      location: "Melrose Park Public School",
      schedule: {
        start: new Date("2027-03-20T13:00:00+11:00"),
        end: new Date("2027-03-20T16:00:00+11:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJNSW Student Workshop",
      location: "TBA (Melrose? MLC?)",
      schedule: {
        start: new Date("2027-05-15T13:00:00+10:00"),
        end: new Date("2027-05-15T16:00:00+10:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJNSW Hunter Regionals",
      description: "Week 2 Term 3",
      schedule: {
        start: new Date("2027-07-29T00:00:00+10:00"),
        end: new Date("2027-07-29T23:59:59+10:00"),
      },
    },
    {
      type: "one-off",
      title: "RCJNSW Sydney Regionals",
      location: "Thomas Hassall Anglican College",
      schedule: {
        start: new Date("2027-07-31T00:00:00+10:00"),
        end: new Date("2027-07-31T23:59:59+10:00"),
      },
    },
  ],
};

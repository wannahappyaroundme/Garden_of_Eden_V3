/**
 * Calendar Types
 * Type definitions for calendar integration and event management
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  recurring: boolean;
  recurrenceRule?: string;
  attendees?: string[];
  organizer?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  url?: string;
  created?: Date;
  lastModified?: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface CalendarConfig {
  icsUrl?: string;
  syncInterval?: number; // minutes
  enabled: boolean;
  timezone?: string;
  workingHoursStart?: number; // 0-23
  workingHoursEnd?: number; // 0-23
}

export interface CalendarSyncResult {
  success: boolean;
  eventsCount: number;
  lastSyncTime: number;
  error?: string;
}

export interface DaySchedule {
  date: Date;
  events: CalendarEvent[];
  freeSlots: TimeSlot[];
  totalBusyMinutes: number;
  totalFreeMinutes: number;
}

export interface CalendarChannels {
  'calendar:sync': {
    request: { icsUrl: string };
    response: CalendarSyncResult;
  };
  'calendar:today': {
    request: void;
    response: { events: CalendarEvent[] };
  };
  'calendar:upcoming': {
    request: { hours: number };
    response: { events: CalendarEvent[] };
  };
  'calendar:free-slots': {
    request: {
      date: Date;
      minDurationMinutes?: number;
      workingHoursOnly?: boolean;
    };
    response: { slots: TimeSlot[] };
  };
  'calendar:get-event': {
    request: { eventId: string };
    response: { event: CalendarEvent | null };
  };
  'calendar:search': {
    request: { query: string; limit?: number };
    response: { events: CalendarEvent[] };
  };
  'calendar:day-schedule': {
    request: { date: Date };
    response: { schedule: DaySchedule };
  };
  'calendar:clear-cache': {
    request: void;
    response: { success: boolean };
  };
}

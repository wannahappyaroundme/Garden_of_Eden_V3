/**
 * Calendar Service
 * Manages calendar synchronization, event parsing, and schedule management
 */

import axios from 'axios';
import * as ical from 'node-ical';
import log from 'electron-log';
import type {
  CalendarEvent,
  TimeSlot,
  CalendarConfig,
  CalendarSyncResult,
  DaySchedule,
} from '@shared/types/calendar.types';

export class CalendarService {
  private events: CalendarEvent[] = [];
  private config: CalendarConfig = {
    enabled: false,
    syncInterval: 30, // 30 minutes
    workingHoursStart: 9,
    workingHoursEnd: 18,
  };
  private lastSyncTime: number = 0;
  private syncTimer: NodeJS.Timeout | null = null;
  private maxCachedEvents = 100;

  constructor(config?: Partial<CalendarConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    log.info('Calendar service initialized');
  }

  /**
   * Sync calendar from ICS URL
   */
  async syncFromICS(icsUrl: string): Promise<CalendarSyncResult> {
    try {
      log.info('Syncing calendar from ICS', { url: icsUrl });

      // Fetch ICS file
      const response = await axios.get(icsUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Garden of Eden V3 Calendar Sync',
        },
      });

      const icsContent = response.data;

      // Parse ICS content
      const parsedEvents = await this.parseICS(icsContent);

      // Store events
      this.events = parsedEvents;
      this.lastSyncTime = Date.now();

      // Save ICS URL for future syncs
      this.config.icsUrl = icsUrl;

      log.info('Calendar sync successful', { eventsCount: parsedEvents.length });

      return {
        success: true,
        eventsCount: parsedEvents.length,
        lastSyncTime: this.lastSyncTime,
      };
    } catch (error) {
      log.error('Failed to sync calendar', error);

      return {
        success: false,
        eventsCount: 0,
        lastSyncTime: this.lastSyncTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Parse ICS content and extract events
   */
  private async parseICS(icsContent: string): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    try {
      // Parse ICS using node-ical
      const parsed = ical.sync.parseICS(icsContent);

      // Process each component
      for (const key in parsed) {
        const component = parsed[key];

        // Only process VEVENT components
        if (component.type === 'VEVENT') {
          try {
            const event = this.convertToCalendarEvent(component);
            if (event) {
              events.push(event);
            }
          } catch (error) {
            log.warn('Failed to convert ICS event', { error, eventKey: key });
          }
        }
      }

      // Sort events by start time
      events.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Limit to max cached events (keep most recent and upcoming)
      const now = new Date();
      const filtered = events.filter(e => e.end >= now || e.recurring);

      if (filtered.length > this.maxCachedEvents) {
        return filtered.slice(0, this.maxCachedEvents);
      }

      return filtered;
    } catch (error) {
      log.error('Failed to parse ICS content', error);
      throw error;
    }
  }

  /**
   * Convert node-ical event to CalendarEvent
   */
  private convertToCalendarEvent(icalEvent: any): CalendarEvent | null {
    try {
      // Extract basic fields
      const id = icalEvent.uid || `event-${Date.now()}-${Math.random()}`;
      const title = icalEvent.summary || 'Untitled Event';
      const description = icalEvent.description || undefined;
      const location = icalEvent.location || undefined;

      // Parse dates
      let start: Date;
      let end: Date;
      let allDay = false;

      if (icalEvent.start) {
        start = new Date(icalEvent.start);
      } else {
        return null; // Events must have start time
      }

      if (icalEvent.end) {
        end = new Date(icalEvent.end);
      } else if (icalEvent.duration) {
        // Calculate end from duration
        const durationMs = icalEvent.duration / 1000; // duration is in ms
        end = new Date(start.getTime() + durationMs);
      } else {
        // Default to 1 hour duration
        end = new Date(start.getTime() + 60 * 60 * 1000);
      }

      // Check if all-day event
      if (icalEvent.datetype === 'date' || (icalEvent.start && !icalEvent.start.getHours)) {
        allDay = true;
      }

      // Extract recurrence info
      const recurring = !!icalEvent.rrule;
      const recurrenceRule = icalEvent.rrule?.toString();

      // Extract attendees
      const attendees: string[] = [];
      if (icalEvent.attendee) {
        if (Array.isArray(icalEvent.attendee)) {
          icalEvent.attendee.forEach((a: any) => {
            if (typeof a === 'string') {
              attendees.push(a.replace('mailto:', ''));
            } else if (a.val) {
              attendees.push(a.val.replace('mailto:', ''));
            }
          });
        } else if (typeof icalEvent.attendee === 'string') {
          attendees.push(icalEvent.attendee.replace('mailto:', ''));
        }
      }

      // Extract organizer
      let organizer: string | undefined;
      if (icalEvent.organizer) {
        if (typeof icalEvent.organizer === 'string') {
          organizer = icalEvent.organizer.replace('mailto:', '');
        } else if (icalEvent.organizer.val) {
          organizer = icalEvent.organizer.val.replace('mailto:', '');
        }
      }

      // Extract status
      let status: 'confirmed' | 'tentative' | 'cancelled' = 'confirmed';
      if (icalEvent.status) {
        const statusLower = icalEvent.status.toLowerCase();
        if (statusLower === 'tentative') status = 'tentative';
        else if (statusLower === 'cancelled') status = 'cancelled';
      }

      // Extract timestamps
      const created = icalEvent.created ? new Date(icalEvent.created) : undefined;
      const lastModified = icalEvent.lastmodified
        ? new Date(icalEvent.lastmodified)
        : undefined;

      const event: CalendarEvent = {
        id,
        title,
        description,
        location,
        start,
        end,
        allDay,
        recurring,
        recurrenceRule,
        attendees: attendees.length > 0 ? attendees : undefined,
        organizer,
        status,
        url: icalEvent.url || undefined,
        created,
        lastModified,
      };

      return event;
    } catch (error) {
      log.error('Failed to convert iCal event', error);
      return null;
    }
  }

  /**
   * Get today's events
   */
  getTodaysEvents(): CalendarEvent[] {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return this.events.filter(event => {
      // Event starts today
      if (event.start >= startOfDay && event.start <= endOfDay) {
        return true;
      }

      // Multi-day event that spans today
      if (event.start < startOfDay && event.end > startOfDay) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get upcoming events within specified hours
   */
  getUpcomingEvents(hours: number): CalendarEvent[] {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return this.events.filter(event => {
      return event.start >= now && event.start <= future;
    });
  }

  /**
   * Find free time slots for a given date
   */
  getFreeSlots(
    date: Date,
    minDurationMinutes: number = 30,
    workingHoursOnly: boolean = true
  ): TimeSlot[] {
    // Get events for the specified date
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const dayEvents = this.events.filter(event => {
      return (
        (event.start >= startOfDay && event.start <= endOfDay) ||
        (event.end >= startOfDay && event.end <= endOfDay) ||
        (event.start < startOfDay && event.end > endOfDay)
      );
    });

    // Sort events by start time
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Determine time range
    let rangeStart: Date;
    let rangeEnd: Date;

    if (workingHoursOnly) {
      rangeStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        this.config.workingHoursStart || 9,
        0,
        0
      );
      rangeEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        this.config.workingHoursEnd || 18,
        0,
        0
      );
    } else {
      rangeStart = startOfDay;
      rangeEnd = endOfDay;
    }

    // Find free slots
    const freeSlots: TimeSlot[] = [];
    let currentTime = rangeStart;

    for (const event of dayEvents) {
      const eventStart = event.start < rangeStart ? rangeStart : event.start;
      const eventEnd = event.end > rangeEnd ? rangeEnd : event.end;

      // If there's a gap before this event
      if (currentTime < eventStart) {
        const durationMinutes = (eventStart.getTime() - currentTime.getTime()) / 1000 / 60;

        if (durationMinutes >= minDurationMinutes) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            durationMinutes: Math.floor(durationMinutes),
          });
        }
      }

      // Move current time to after this event
      if (eventEnd > currentTime) {
        currentTime = eventEnd;
      }
    }

    // Check if there's time after the last event
    if (currentTime < rangeEnd) {
      const durationMinutes = (rangeEnd.getTime() - currentTime.getTime()) / 1000 / 60;

      if (durationMinutes >= minDurationMinutes) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(rangeEnd),
          durationMinutes: Math.floor(durationMinutes),
        });
      }
    }

    return freeSlots;
  }

  /**
   * Get day schedule (events + free slots + statistics)
   */
  getDaySchedule(date: Date): DaySchedule {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    // Get events for the day
    const events = this.events.filter(event => {
      return (
        (event.start >= startOfDay && event.start <= endOfDay) ||
        (event.end >= startOfDay && event.end <= endOfDay) ||
        (event.start < startOfDay && event.end > endOfDay)
      );
    });

    // Sort events
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Get free slots
    const freeSlots = this.getFreeSlots(date, 15, false); // 15 min minimum, all day

    // Calculate busy time
    let totalBusyMinutes = 0;
    events.forEach(event => {
      const eventStart = event.start < startOfDay ? startOfDay : event.start;
      const eventEnd = event.end > endOfDay ? endOfDay : event.end;
      const duration = (eventEnd.getTime() - eventStart.getTime()) / 1000 / 60;
      totalBusyMinutes += duration;
    });

    // Calculate free time
    let totalFreeMinutes = 0;
    freeSlots.forEach(slot => {
      totalFreeMinutes += slot.durationMinutes;
    });

    return {
      date,
      events,
      freeSlots,
      totalBusyMinutes: Math.floor(totalBusyMinutes),
      totalFreeMinutes,
    };
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): CalendarEvent | null {
    return this.events.find(e => e.id === eventId) || null;
  }

  /**
   * Search events by query
   */
  searchEvents(query: string, limit: number = 50): CalendarEvent[] {
    const lowerQuery = query.toLowerCase();

    const results = this.events.filter(event => {
      // Search in title
      if (event.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in description
      if (event.description && event.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in location
      if (event.location && event.location.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });

    return results.slice(0, limit);
  }

  /**
   * Clear event cache
   */
  clearCache(): boolean {
    this.events = [];
    this.lastSyncTime = 0;
    log.info('Calendar cache cleared');
    return true;
  }

  /**
   * Get current configuration
   */
  getConfig(): CalendarConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CalendarConfig>): void {
    this.config = { ...this.config, ...config };
    log.info('Calendar config updated', this.config);

    // Restart sync timer if interval changed
    if (config.syncInterval && this.syncTimer) {
      this.stopAutoSync();
      if (this.config.enabled && this.config.icsUrl) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    if (!this.config.icsUrl) {
      log.warn('Cannot start auto-sync: ICS URL not configured');
      return;
    }

    if (this.syncTimer) {
      log.warn('Auto-sync already running');
      return;
    }

    const intervalMs = (this.config.syncInterval || 30) * 60 * 1000;

    this.syncTimer = setInterval(async () => {
      if (this.config.icsUrl) {
        await this.syncFromICS(this.config.icsUrl);
      }
    }, intervalMs);

    log.info('Auto-sync started', { intervalMinutes: this.config.syncInterval });
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      log.info('Auto-sync stopped');
    }
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up calendar service');
    this.stopAutoSync();
    this.events = [];
  }
}

// Singleton instance
let calendarServiceInstance: CalendarService | null = null;

export function getCalendarService(): CalendarService {
  if (!calendarServiceInstance) {
    calendarServiceInstance = new CalendarService();
  }
  return calendarServiceInstance;
}

export async function cleanupCalendarService(): Promise<void> {
  if (calendarServiceInstance) {
    await calendarServiceInstance.cleanup();
    calendarServiceInstance = null;
  }
}

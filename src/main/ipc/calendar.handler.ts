/**
 * Calendar IPC Handler
 * Handles calendar operations from renderer process
 */

import { ipcMain } from 'electron';
import { getCalendarService } from '../services/calendar/calendar.service';
import type { CalendarChannels } from '../../shared/types/calendar.types';
import log from 'electron-log';

/**
 * Register all calendar IPC handlers
 */
export function registerCalendarHandlers(): void {
  const calendarService = getCalendarService();

  // Sync from ICS
  ipcMain.handle(
    'calendar:sync',
    async (_, request: CalendarChannels['calendar:sync']['request']) => {
      try {
        log.info('Calendar sync requested', { url: request.icsUrl });
        const result = await calendarService.syncFromICS(request.icsUrl);

        return result;
      } catch (error) {
        log.error('Failed to sync calendar', error);
        throw new Error(
          'Failed to sync calendar: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get today's events
  ipcMain.handle('calendar:today', async () => {
    try {
      const events = calendarService.getTodaysEvents();
      return { events };
    } catch (error) {
      log.error('Failed to get today events', error);
      throw new Error(
        'Failed to get today events: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Get upcoming events
  ipcMain.handle(
    'calendar:upcoming',
    async (_, request: CalendarChannels['calendar:upcoming']['request']) => {
      try {
        log.info('Upcoming events requested', { hours: request.hours });
        const events = calendarService.getUpcomingEvents(request.hours);

        return { events };
      } catch (error) {
        log.error('Failed to get upcoming events', error);
        throw new Error(
          'Failed to get upcoming events: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get free slots
  ipcMain.handle(
    'calendar:free-slots',
    async (_, request: CalendarChannels['calendar:free-slots']['request']) => {
      try {
        log.info('Free slots requested', { date: request.date });
        const slots = calendarService.getFreeSlots(
          new Date(request.date),
          request.minDurationMinutes,
          request.workingHoursOnly
        );

        return { slots };
      } catch (error) {
        log.error('Failed to get free slots', error);
        throw new Error(
          'Failed to get free slots: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get event by ID
  ipcMain.handle(
    'calendar:get-event',
    async (_, request: CalendarChannels['calendar:get-event']['request']) => {
      try {
        const event = calendarService.getEvent(request.eventId);
        return { event };
      } catch (error) {
        log.error('Failed to get event', error);
        throw new Error(
          'Failed to get event: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Search events
  ipcMain.handle(
    'calendar:search',
    async (_, request: CalendarChannels['calendar:search']['request']) => {
      try {
        log.info('Event search requested', { query: request.query });
        const events = calendarService.searchEvents(request.query, request.limit);

        return { events };
      } catch (error) {
        log.error('Failed to search events', error);
        throw new Error(
          'Failed to search events: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get day schedule
  ipcMain.handle(
    'calendar:day-schedule',
    async (_, request: CalendarChannels['calendar:day-schedule']['request']) => {
      try {
        log.info('Day schedule requested', { date: request.date });
        const schedule = calendarService.getDaySchedule(new Date(request.date));

        return { schedule };
      } catch (error) {
        log.error('Failed to get day schedule', error);
        throw new Error(
          'Failed to get day schedule: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Clear cache
  ipcMain.handle('calendar:clear-cache', async () => {
    try {
      log.info('Calendar cache clear requested');
      const success = calendarService.clearCache();

      return { success };
    } catch (error) {
      log.error('Failed to clear calendar cache', error);
      throw new Error(
        'Failed to clear calendar cache: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  log.info('[IPC] Calendar handlers registered');
}

/**
 * Cleanup calendar resources on app quit
 */
export async function cleanupCalendarResources(): Promise<void> {
  try {
    log.info('Cleaning up calendar resources...');
    const { cleanupCalendarService } = await import('../services/calendar/calendar.service');
    await cleanupCalendarService();

    log.info('Calendar resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up calendar resources', error);
  }
}

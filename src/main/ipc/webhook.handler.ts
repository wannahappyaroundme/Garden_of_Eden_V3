/**
 * Webhook IPC Handler
 * Handles webhook operations from renderer process
 */

import { ipcMain } from 'electron';
import { getWebhookService } from '../services/webhook/webhook.service';
import type { WebhookChannels } from '../../shared/types/webhook.types';
import log from 'electron-log';

/**
 * Register all webhook IPC handlers
 */
export function registerWebhookHandlers(): void {
  const webhookService = getWebhookService();

  // Register webhook
  ipcMain.handle(
    'webhook:register',
    async (_, request: WebhookChannels['webhook:register']['request']) => {
      try {
        log.info('Webhook registration requested', { name: request.config.name });
        const webhook = webhookService.registerWebhook(request.config);

        return { success: true, webhook };
      } catch (error) {
        log.error('Failed to register webhook', error);
        throw new Error(
          'Failed to register webhook: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Trigger webhook
  ipcMain.handle(
    'webhook:trigger',
    async (_, request: WebhookChannels['webhook:trigger']['request']) => {
      try {
        log.info('Webhook trigger requested', { name: request.name });
        const response = await webhookService.triggerWebhook(request.name, request.payload);

        return response;
      } catch (error) {
        log.error('Failed to trigger webhook', error);
        throw new Error(
          'Failed to trigger webhook: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // List webhooks
  ipcMain.handle('webhook:list', async () => {
    try {
      const webhooks = webhookService.getAllWebhooks();
      return { webhooks };
    } catch (error) {
      log.error('Failed to list webhooks', error);
      throw new Error(
        'Failed to list webhooks: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Get webhook
  ipcMain.handle('webhook:get', async (_, request: WebhookChannels['webhook:get']['request']) => {
    try {
      const webhook = webhookService.getWebhook(request.name);
      return { webhook };
    } catch (error) {
      log.error('Failed to get webhook', error);
      throw new Error(
        'Failed to get webhook: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Update webhook
  ipcMain.handle(
    'webhook:update',
    async (_, request: WebhookChannels['webhook:update']['request']) => {
      try {
        log.info('Webhook update requested', { name: request.name });
        const success = webhookService.updateWebhook(request.name, request.updates);

        return { success };
      } catch (error) {
        log.error('Failed to update webhook', error);
        throw new Error(
          'Failed to update webhook: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Delete webhook
  ipcMain.handle(
    'webhook:delete',
    async (_, request: WebhookChannels['webhook:delete']['request']) => {
      try {
        log.info('Webhook deletion requested', { name: request.name });
        const success = webhookService.deleteWebhook(request.name);

        return { success };
      } catch (error) {
        log.error('Failed to delete webhook', error);
        throw new Error(
          'Failed to delete webhook: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Test webhook
  ipcMain.handle(
    'webhook:test',
    async (_, request: WebhookChannels['webhook:test']['request']) => {
      try {
        log.info('Webhook test requested', { name: request.name });
        const response = await webhookService.testWebhook(request.name);

        return response;
      } catch (error) {
        log.error('Failed to test webhook', error);
        throw new Error(
          'Failed to test webhook: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Send Slack message
  ipcMain.handle(
    'webhook:send-slack',
    async (_, request: WebhookChannels['webhook:send-slack']['request']) => {
      try {
        log.info('Slack message send requested');
        const response = await webhookService.sendToSlack(request.webhookUrl, request.message);

        return response;
      } catch (error) {
        log.error('Failed to send Slack message', error);
        throw new Error(
          'Failed to send Slack message: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Send Discord message
  ipcMain.handle(
    'webhook:send-discord',
    async (_, request: WebhookChannels['webhook:send-discord']['request']) => {
      try {
        log.info('Discord message send requested');
        const response = await webhookService.sendToDiscord(request.webhookUrl, request.message);

        return response;
      } catch (error) {
        log.error('Failed to send Discord message', error);
        throw new Error(
          'Failed to send Discord message: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Send Notion page
  ipcMain.handle(
    'webhook:send-notion',
    async (_, request: WebhookChannels['webhook:send-notion']['request']) => {
      try {
        log.info('Notion page creation requested');
        const response = await webhookService.sendToNotion(request.apiKey, request.page);

        return response;
      } catch (error) {
        log.error('Failed to create Notion page', error);
        throw new Error(
          'Failed to create Notion page: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  log.info('[IPC] Webhook handlers registered');
}

/**
 * Cleanup webhook resources on app quit
 */
export async function cleanupWebhookResources(): Promise<void> {
  try {
    log.info('Cleaning up webhook resources...');
    const { cleanupWebhookService } = await import('../services/webhook/webhook.service');
    await cleanupWebhookService();

    log.info('Webhook resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up webhook resources', error);
  }
}

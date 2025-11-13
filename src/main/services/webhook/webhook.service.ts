/**
 * Webhook Service
 * Manages webhook configurations and triggers HTTP requests to external services
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import log from 'electron-log';
import type {
  WebhookConfig,
  WebhookPayload,
  WebhookResponse,
  WebhookPreset,
  SlackMessage,
  DiscordMessage,
  NotionPage,
} from '@shared/types/webhook.types';

export class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private defaultTimeout = 10000; // 10 seconds
  private defaultRetries = 3;

  constructor() {
    log.info('Webhook service initialized');
  }

  /**
   * Register a new webhook
   */
  registerWebhook(config: Omit<WebhookConfig, 'createdAt' | 'lastUsedAt'>): WebhookConfig {
    try {
      // Validate webhook name
      if (!config.name || config.name.trim() === '') {
        throw new Error('Webhook name is required');
      }

      // Validate URL
      if (!config.url || !this.isValidUrl(config.url)) {
        throw new Error('Invalid webhook URL');
      }

      // Check if webhook already exists
      if (this.webhooks.has(config.name)) {
        throw new Error(`Webhook '${config.name}' already exists`);
      }

      // Create webhook with defaults
      const webhook: WebhookConfig = {
        ...config,
        method: config.method || 'POST',
        enabled: config.enabled !== false,
        timeout: config.timeout || this.defaultTimeout,
        retries: config.retries !== undefined ? config.retries : this.defaultRetries,
        createdAt: Date.now(),
      };

      this.webhooks.set(config.name, webhook);

      log.info('Webhook registered', { name: webhook.name, preset: webhook.preset });

      return webhook;
    } catch (error) {
      log.error('Failed to register webhook', error);
      throw error;
    }
  }

  /**
   * Update webhook configuration
   */
  updateWebhook(
    name: string,
    updates: Partial<Omit<WebhookConfig, 'name' | 'createdAt'>>
  ): boolean {
    try {
      const webhook = this.webhooks.get(name);
      if (!webhook) {
        throw new Error(`Webhook '${name}' not found`);
      }

      // Validate URL if being updated
      if (updates.url && !this.isValidUrl(updates.url)) {
        throw new Error('Invalid webhook URL');
      }

      // Apply updates
      const updatedWebhook: WebhookConfig = {
        ...webhook,
        ...updates,
      };

      this.webhooks.set(name, updatedWebhook);

      log.info('Webhook updated', { name });

      return true;
    } catch (error) {
      log.error('Failed to update webhook', error);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  deleteWebhook(name: string): boolean {
    try {
      if (!this.webhooks.has(name)) {
        throw new Error(`Webhook '${name}' not found`);
      }

      this.webhooks.delete(name);

      log.info('Webhook deleted', { name });

      return true;
    } catch (error) {
      log.error('Failed to delete webhook', error);
      throw error;
    }
  }

  /**
   * Get webhook by name
   */
  getWebhook(name: string): WebhookConfig | null {
    return this.webhooks.get(name) || null;
  }

  /**
   * Get all webhooks
   */
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Trigger a webhook
   */
  async triggerWebhook(name: string, payload: WebhookPayload): Promise<WebhookResponse> {
    try {
      const webhook = this.webhooks.get(name);
      if (!webhook) {
        throw new Error(`Webhook '${name}' not found`);
      }

      if (!webhook.enabled) {
        throw new Error(`Webhook '${name}' is disabled`);
      }

      log.info('Triggering webhook', { name, preset: webhook.preset });

      // Format payload based on preset
      const formattedPayload = this.formatPayload(webhook.preset, payload);

      // Execute webhook with retries
      const response = await this.executeWebhook(webhook, formattedPayload);

      // Update last used timestamp
      webhook.lastUsedAt = Date.now();
      this.webhooks.set(name, webhook);

      log.info('Webhook triggered successfully', {
        name,
        statusCode: response.statusCode,
      });

      return response;
    } catch (error) {
      log.error('Failed to trigger webhook', { name, error });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test a webhook without saving it
   */
  async testWebhook(name: string): Promise<WebhookResponse> {
    try {
      const webhook = this.webhooks.get(name);
      if (!webhook) {
        throw new Error(`Webhook '${name}' not found`);
      }

      log.info('Testing webhook', { name });

      // Create a simple test payload
      const testPayload = {
        test: true,
        message: 'This is a test message from Garden of Eden V3',
        timestamp: new Date().toISOString(),
      };

      const formattedPayload = this.formatPayload(webhook.preset, testPayload);

      return await this.executeWebhook(webhook, formattedPayload);
    } catch (error) {
      log.error('Failed to test webhook', { name, error });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a message to Slack
   */
  async sendToSlack(webhookUrl: string, message: SlackMessage): Promise<WebhookResponse> {
    try {
      log.info('Sending message to Slack');

      const response = await axios.post(webhookUrl, message, {
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      log.error('Failed to send Slack message', error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          statusCode: error.response?.status,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a message to Discord
   */
  async sendToDiscord(webhookUrl: string, message: DiscordMessage): Promise<WebhookResponse> {
    try {
      log.info('Sending message to Discord');

      const response = await axios.post(webhookUrl, message, {
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      log.error('Failed to send Discord message', error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          statusCode: error.response?.status,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a page to Notion
   */
  async sendToNotion(apiKey: string, page: NotionPage): Promise<WebhookResponse> {
    try {
      log.info('Creating Notion page');

      const response = await axios.post('https://api.notion.com/v1/pages', page, {
        timeout: this.defaultTimeout,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      });

      return {
        success: true,
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      log.error('Failed to create Notion page', error);

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          statusCode: error.response?.status,
          error: error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute webhook with retries
   */
  private async executeWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookResponse> {
    let lastError: Error | null = null;
    const maxRetries = webhook.retries || this.defaultRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          log.info('Retrying webhook', { name: webhook.name, attempt });
          // Exponential backoff: 1s, 2s, 4s, etc.
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }

        const config: AxiosRequestConfig = {
          method: webhook.method || 'POST',
          url: webhook.url,
          data: payload,
          timeout: webhook.timeout || this.defaultTimeout,
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
          },
        };

        const response: AxiosResponse = await axios(config);

        return {
          success: true,
          statusCode: response.status,
          data: response.data,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        log.warn('Webhook attempt failed', {
          name: webhook.name,
          attempt,
          error: lastError.message,
        });

        // If it's a 4xx error (client error), don't retry
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw lastError;
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error('Webhook failed after all retries');
  }

  /**
   * Format payload based on preset
   */
  private formatPayload(preset: WebhookPreset, payload: WebhookPayload): WebhookPayload {
    switch (preset) {
      case 'slack':
        return this.formatSlackPayload(payload);

      case 'discord':
        return this.formatDiscordPayload(payload);

      case 'notion':
        // Notion payloads are more complex and should be pre-formatted
        return payload;

      case 'custom':
      default:
        return payload;
    }
  }

  /**
   * Format payload for Slack
   */
  private formatSlackPayload(payload: WebhookPayload): SlackMessage {
    // If payload is already a SlackMessage, return as-is
    if (payload.text || payload.blocks || payload.attachments) {
      return payload as SlackMessage;
    }

    // Simple text formatting
    const text = payload.message || payload.text || JSON.stringify(payload, null, 2);

    return {
      text,
      username: payload.username || 'Garden of Eden V3',
      icon_emoji: payload.icon_emoji || ':robot_face:',
    };
  }

  /**
   * Format payload for Discord
   */
  private formatDiscordPayload(payload: WebhookPayload): DiscordMessage {
    // If payload is already a DiscordMessage, return as-is
    if (payload.content || payload.embeds) {
      return payload as DiscordMessage;
    }

    // Simple text formatting
    const content = payload.message || payload.content || JSON.stringify(payload, null, 2);

    return {
      content,
      username: payload.username || 'Garden of Eden V3',
      avatar_url: payload.avatar_url,
    };
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up webhook service');
    this.webhooks.clear();
  }
}

// Singleton instance
let webhookServiceInstance: WebhookService | null = null;

export function getWebhookService(): WebhookService {
  if (!webhookServiceInstance) {
    webhookServiceInstance = new WebhookService();
  }
  return webhookServiceInstance;
}

export async function cleanupWebhookService(): Promise<void> {
  if (webhookServiceInstance) {
    await webhookServiceInstance.cleanup();
    webhookServiceInstance = null;
  }
}

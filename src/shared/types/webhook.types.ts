/**
 * Webhook Types
 * Type definitions for webhook system and external integrations
 */

export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type WebhookPreset = 'slack' | 'discord' | 'notion' | 'custom';

export interface WebhookHeaders {
  [key: string]: string;
}

export interface WebhookConfig {
  name: string;
  preset: WebhookPreset;
  url: string;
  method?: WebhookMethod;
  headers?: WebhookHeaders;
  enabled: boolean;
  timeout?: number; // milliseconds
  retries?: number;
  createdAt: number;
  lastUsedAt?: number;
}

export interface WebhookPayload {
  [key: string]: any;
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  data?: any;
  error?: string;
}

export interface SlackMessage {
  text?: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    [key: string]: any;
  }>;
  attachments?: Array<{
    color?: string;
    text?: string;
    fields?: Array<{
      title: string;
      value: string;
      short?: boolean;
    }>;
    [key: string]: any;
  }>;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  author?: {
    name: string;
    icon_url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface NotionPageProperties {
  [key: string]: {
    title?: Array<{ text: { content: string } }>;
    rich_text?: Array<{ text: { content: string } }>;
    number?: number;
    select?: { name: string };
    multi_select?: Array<{ name: string }>;
    date?: { start: string; end?: string };
    checkbox?: boolean;
    url?: string;
    email?: string;
    phone_number?: string;
  };
}

export interface NotionPage {
  parent: {
    database_id: string;
  };
  properties: NotionPageProperties;
}

export interface WebhookChannels {
  'webhook:register': {
    request: {
      config: Omit<WebhookConfig, 'createdAt' | 'lastUsedAt'>;
    };
    response: { success: boolean; webhook: WebhookConfig };
  };
  'webhook:trigger': {
    request: {
      name: string;
      payload: WebhookPayload;
    };
    response: WebhookResponse;
  };
  'webhook:list': {
    request: void;
    response: { webhooks: WebhookConfig[] };
  };
  'webhook:get': {
    request: { name: string };
    response: { webhook: WebhookConfig | null };
  };
  'webhook:update': {
    request: {
      name: string;
      updates: Partial<Omit<WebhookConfig, 'name' | 'createdAt'>>;
    };
    response: { success: boolean };
  };
  'webhook:delete': {
    request: { name: string };
    response: { success: boolean };
  };
  'webhook:test': {
    request: { name: string };
    response: WebhookResponse;
  };
  // Preset-specific channels
  'webhook:send-slack': {
    request: {
      webhookUrl: string;
      message: SlackMessage;
    };
    response: WebhookResponse;
  };
  'webhook:send-discord': {
    request: {
      webhookUrl: string;
      message: DiscordMessage;
    };
    response: WebhookResponse;
  };
  'webhook:send-notion': {
    request: {
      apiKey: string;
      page: NotionPage;
    };
    response: WebhookResponse;
  };
}

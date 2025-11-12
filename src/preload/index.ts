/**
 * Preload Script
 * Secure IPC bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IPCChannelName } from '../shared/types/ipc.types';

/**
 * Exposed API for renderer process
 * Available as window.api in renderer
 */
const api = {
  /**
   * Invoke IPC call and wait for response
   */
  invoke: async <T extends IPCChannelName>(
    channel: T,
    data: unknown
  ): Promise<unknown> => {
    return await ipcRenderer.invoke(channel, data);
  },

  /**
   * Send one-way IPC message (no response expected)
   */
  send: (channel: string, data: unknown): void => {
    ipcRenderer.send(channel, data);
  },

  /**
   * Listen for IPC events from main process
   */
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
    ipcRenderer.on(channel, callback);
  },

  /**
   * Remove IPC event listener
   */
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback);
  },

  /**
   * Remove all listeners for a channel
   */
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('api', api);

// TypeScript declaration for window.api
declare global {
  interface Window {
    api: typeof api;
  }
}

export type { };

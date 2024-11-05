/* eslint-disable @typescript-eslint/no-explicit-any */
// webContainerInstance.ts
import { WebContainer } from '@webcontainer/api';

let instance: any = null;
let initializationPromise: Promise<any> | null = null;

export const getWebContainerInstance = async (): Promise<any> => {
  if (instance) {
    return instance;
  }

  if (!initializationPromise) {
    initializationPromise = WebContainer.boot().then((bootedInstance) => {
      instance = bootedInstance;
      return instance;
    });
  }

  return initializationPromise;
};

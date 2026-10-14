/**
 * config/index.ts
 * Re-exports all website configs and the central loader.
 */

export { default as website1, createWebsiteConfig as createWebsite1Config } from './website1';
export { default as website2, createWebsiteConfig as createWebsite2Config } from './website2';
export { default as website3, createWebsiteConfig as createWebsite3Config } from './website3';
export { getWebsiteConfig } from './getWebsiteConfig';
export type { GetWebsiteConfigResult } from './getWebsiteConfig';

import { BadRequestException } from '@nestjs/common';

/**
 * Resolves the API key to use for external service requests
 * @param {string} [userApiKey] - Optional user-provided API key
 * @param {string} [defaultApiKey] - Optional default API key from environment
 * @returns {string} The resolved API key to use
 * @throws {BadRequestException} When neither user API key nor default API key is provided
 */
export function getApiKey(userApiKey?: string, defaultApiKey?: string): string {
  if (userApiKey) return userApiKey;
  if (defaultApiKey) return defaultApiKey;
  throw new BadRequestException('API key is required');
}
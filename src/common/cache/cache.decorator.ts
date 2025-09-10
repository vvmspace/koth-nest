import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to cache method results
 */
export function Cacheable(key?: string, ttl?: number) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService;
      
      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const cacheKey = key || `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Decorator to invalidate cache
 */
export function CacheInvalidate(key?: string) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService;
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Invalidate cache
      if (cacheService && key) {
        cacheService.delete(key);
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Metadata decorators
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

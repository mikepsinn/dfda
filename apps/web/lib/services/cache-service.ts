import { Redis } from '@upstash/redis'
import { createClient, RedisClientType } from 'redis'

type RedisValue = string | null;

export class CacheService {
  private static instance: CacheService
  private redisClient: Redis | RedisClientType | null = null
  private readonly CACHE_TTL = 3600
  private isInitialized = false

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  private async initializeRedisClient() {
    if (this.redisClient && this.isInitialized) return this.redisClient

    const useLocalRedis = process.env.USE_LOCAL_REDIS === 'true'

    try {
      if (useLocalRedis) {
        const localRedisUrl = process.env.LOCAL_REDIS_URL || 'redis://localhost:6379'
        this.redisClient = createClient({ url: localRedisUrl }) as RedisClientType
        await this.redisClient.connect()
        
        // Test connection
        await this.redisClient.ping()
      } else {
        const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
        const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

        if (!upstashRedisRestUrl || !upstashRedisRestToken) {
          throw new Error('Redis configuration missing: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
        }

        this.redisClient = new Redis({
          url: upstashRedisRestUrl,
          token: upstashRedisRestToken
        })

        // Test connection
        await this.redisClient.ping()
      }

      this.isInitialized = true
      return this.redisClient
    } catch (error) {
      this.redisClient = null
      this.isInitialized = false
      throw new Error(`Failed to initialize Redis client: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getRedisValue(client: Redis | RedisClientType, key: string): Promise<RedisValue> {
    if (client instanceof Redis) {
      return client.get(key)
    }
    return client.get(key) as Promise<RedisValue>
  }

  private async setRedisValue(client: Redis | RedisClientType, key: string, value: string): Promise<void> {
    if (client instanceof Redis) {
      await client.set(key, value, { ex: this.CACHE_TTL })
    } else {
      await client.set(key, value, { EX: this.CACHE_TTL })
    }
  }

  private async deleteRedisKey(client: Redis | RedisClientType, key: string): Promise<void> {
    if (client instanceof Redis) {
      await client.del(key)
    } else {
      await client.del(key)
    }
  }

  private async getRedisKeys(client: Redis | RedisClientType): Promise<string[]> {
    if (client instanceof Redis) {
      return client.keys('*')
    }
    return client.keys('*')
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.initializeRedisClient()
      if (!client) {
        throw new Error('Redis client not available')
      }

      const data = await this.getRedisValue(client, key)
      if (!data) return null

      try {
        // Ensure we're working with a string
        const stringData = typeof data === 'string' ? data : JSON.stringify(data)
        return JSON.parse(stringData)
      } catch (parseError) {
        console.error('Failed to parse cached data:', parseError)
        // Only delete the corrupted key
        const client = await this.initializeRedisClient()
        if (client) {
          await this.deleteRedisKey(client, key)
          console.log(`Deleted corrupted JSON cache key: ${key}`)
        }
        return null
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Redis client not available')) {
        throw error // Re-throw Redis availability errors
      }
      console.error('Redis cache error:', error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const client = await this.initializeRedisClient()
      if (!client) {
        throw new Error('Redis client not available')
      }

      // Ensure we're storing a string
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      await this.setRedisValue(client, key, stringValue)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Redis client not available')) {
        throw error // Re-throw Redis availability errors
      }
      console.error('Redis cache error:', error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      const client = await this.initializeRedisClient()
      if (!client) {
        throw new Error('Redis client not available')
      }

      const keys = await this.getRedisKeys(client)
      
      for (const key of keys) {
        try {
          const value = await this.getRedisValue(client, key)
          if (!value) continue

          // Only check for JSON validity if the key matches our JSON-storing patterns
          if (key.startsWith('exa:') || key.startsWith('article:') || key.startsWith('search:') || key.startsWith('test:')) {
            try {
              // Ensure we're parsing a string
              const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
              JSON.parse(stringValue)
            } catch (parseError) {
              await this.deleteRedisKey(client, key)
              console.log(`Deleted corrupted JSON cache key: ${key}`)
            }
          }
        } catch (error) {
          // If we can't even read the value, delete the key
          await this.deleteRedisKey(client, key)
          console.log(`Deleted inaccessible cache key: ${key}`)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Redis client not available')) {
        throw error // Re-throw Redis availability errors
      }
      console.error('Cache cleanup error:', error)
    }
  }
} 
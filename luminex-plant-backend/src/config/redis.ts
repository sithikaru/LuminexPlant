import Redis from 'ioredis'

let redis: Redis | null = null

const connectRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err)
    })
  }

  return redis
}

export default connectRedis

import Redis from 'ioredis'

import { REDIS_URL } from './constant'

export const redis = new Redis(REDIS_URL)

export const redisSub = new Redis(REDIS_URL)

export const redisSubOrga = new Redis(REDIS_URL)

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
// @ts-expect-error - Type compatibility between neon and drizzle versions
export const db = drizzle(sql, { schema })

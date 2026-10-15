// Local API server for `npm run dev`. Vite proxies /api here.
import { existsSync } from 'node:fs'
import { serve } from '@hono/node-server'

if (existsSync('.env')) process.loadEnvFile('.env')
if (!process.env.STEAM_API_KEY) console.warn('STEAM_API_KEY is not set; copy .env.example to .env')

const { default: app } = await import('./app.js')

serve({ fetch: app.fetch, port: 8787 }, ({ port }) => console.log(`API on http://localhost:${port}/api`))

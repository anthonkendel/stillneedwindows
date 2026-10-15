// Vercel Function entry. vercel.json rewrites every /api/* request here;
// the original path is kept, so the Hono router (basePath /api) sees it.
import { handle } from 'hono/vercel'
import app from '../server/app.js'

export const GET = handle(app)

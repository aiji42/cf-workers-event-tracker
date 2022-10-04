import { Hono } from 'hono'
import type { Database } from '@cloudflare/d1'

interface Bindings {
	DB: Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/", async (c) => {
	const response = await c.env.DB.prepare(
		`SELECT visitToken FROM Visit`
	).all();
	c.json(response)
});

export default app
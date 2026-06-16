This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment

Recommended approaches to deploy the project:

- Docker Compose (server)
	- From the `backend/` folder run:
		```bash
		docker compose up -d --build
		```
	- This brings up Postgres (with pgvector), Ollama and the FastAPI backend. The backend Dockerfile is in `backend/Dockerfile`.

- Deploying the frontend with Coolify
	- In Coolify set the build context to `frontend/` and use the provided `frontend/Dockerfile` (it builds with `pnpm` and runs `pnpm start`).
	- Add required environment variables in Coolify or via `.env`:
		- `NEXT_PUBLIC_API_URL` (e.g. `http://<backend-host>:8001`)
		- `BETTER_AUTH_URL` (if used)

		- Important: `next.config.ts` uses `process.env.BACKEND_URL` at build time to configure rewrites. Make sure to set the `BACKEND_URL` build environment variable in Coolify (or pass it as a build-arg) so API calls to `/api/v1/*` are rewritten to your backend host.
			Example in Coolify build settings: `BACKEND_URL=http://your-backend:8001`

Notes
- Ensure backend `DATABASE_URL` uses secure credentials and points to the Postgres service (`postgres:5432` when using compose).
- For TLS, use a reverse proxy (nginx) or the platform-managed certificates provided by Coolify.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Installation

To install the project, clone the repository and install dependencies:

```bash
git clone https://github.com/smithdavedesign/AI-Trend-Tracker.git
cd AI-Trend-Tracker
npm install
```

## Configuration

Copy the example environment file and fill in the required variables:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your configuration values.

The following variables are available (see `.env.local.example` for details):

- `DATABASE_URL`: Neon Postgres connection string
- `ANTHROPIC_API_KEY`: API key for Anthropic (Claude)
- `INNGEST_DEV`: Set to 1 for development (no keys needed)
- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`: For production Inngest
- `RESEND_API_KEY`: For email digests
- `RESEND_FROM`: The from address for emails
- `GITHUB_TOKEN`: GitHub API token (optional, raises rate limit)
- `PRODUCT_HUNT_TOKEN`: Product Hunt developer token (optional)
- `REVALIDATION_SECRET`: For on-demand ISR cache busting
- `ADMIN_PASSWORD`: Admin dashboard password
- `NEXT_PUBLIC_SITE_URL`: Public site URL (used in OG images, feeds, and digest emails)

Note: Some variables are optional and have default values in development.

## Available Scripts

The project includes the following npm scripts:

- `dev`: Run the development server (`next dev`)
- `build`: Build the application for production (`next build`)
- `start`: Start the production server (`next start`)
- `lint`: Run ESLint to check for code issues
- `test`: Run Vitest tests once
- `test:watch`: Run Vitest tests in watch mode

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

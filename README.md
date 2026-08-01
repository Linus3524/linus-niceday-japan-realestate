<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3bc4faa3-a9cc-4a08-93f0-d2da075a0004

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optional: set `TRANSITOUS_USER_AGENT` to identify this app when using the free Transitous route service. Route results use Transitous first and Gemini Search only when its Japan GTFS coverage is unavailable.

Successful commute routes are cached in memory for local use. When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured, verified results are also retained for 30 days across server restarts and Vercel invocations.
3. Run the app:
   `npm run dev`

# CollegeBook News & Feeds Backend

## Provider

The first provider is **NewsData.io**.

The backend calls NewsData.io server-side so the API key never appears in the React application.

The free NewsData.io plan currently provides 200 API credits per day, with 10 articles per credit and a 12-hour delay. The application therefore uses server-side caching and a default one-hour cache window rather than making a provider request for every student request.

## Environment variables

Add these to the backend `.env`:

```env
NEWSDATA_API_KEY=
NEWSDATA_API_URL=https://newsdata.io/api/1/latest
NEWS_FEEDS_CACHE_MINUTES=60
NEWS_FEEDS_COUNTRIES=ng,us,gb
NEWS_FEEDS_LANGUAGE=en
NEWS_FEEDS_LIMIT=10
```

Do not commit the real API key.

## API

Authenticated users can call:

```text
GET /api/news-feeds
GET /api/news-feeds?category=technology
GET /api/news-feeds?category=jobs
GET /api/news-feeds/categories
```

The frontend can therefore request one category or all categories.

## Categories

- jobs
- technology
- fashion
- scholarships
- business
- skills
- competitions
- global

## Caching

The service keeps a successful result in memory for the configured cache period.

This means:

```text
Student A → provider request
Student B → cached result
Student C → cached result
```

instead of:

```text
Student A → provider
Student B → provider
Student C → provider
```

This protects the free API quota.

If the provider is temporarily unavailable and an older successful result exists, the service returns that stale result instead of failing the entire page.

## Why no Prisma migration yet?

News articles are intentionally not stored in PostgreSQL in this first version.

The first version treats the provider as a live discovery source and keeps a short server-side cache. This avoids filling the CollegeBook database with third-party article copies and avoids creating a permanent archive of publisher content.

A later version can add a database table for editorial curation, favorites, source management, or analytics if that becomes necessary.

## Important deployment note

The NewsData.io key must exist in the backend environment on the deployed server. It must never be placed in a `VITE_*` frontend variable.


## Nigerian News

`GET /api/news-feeds/nigeria` returns the latest English-language news from Nigerian sources using NewsData.io's `country=ng` filter. It uses the same backend-only API key and 60-minute cache. This endpoint is deliberately separate from the general feed so selecting Nigerian News does not add another provider request to every student's default feed refresh.

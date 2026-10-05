# CollegeBook News & Feeds — Frontend

This feature adds a new **News & Feeds** destination without changing the existing CollegeBook landing-page layout.

## Navigation

- Desktop left sidebar: `News & Feeds`
- Route: `/news-feeds`

The existing home/feed page, right sidebar, YearBook UI, authentication screens, admin routes and other layouts are not redesigned by this feature.

## Categories

- Jobs & Internships
- Technology
- Fashion & Lifestyle
- Scholarships
- Business & Startups
- Skills & Learning
- Competitions
- Global Opportunities

## API contract

The frontend is prepared for:

`GET /api/news-feeds`

Optional query parameters:

- `category`
- `q`
- `limit`

Expected response shape:

```json
{
  "items": [
    {
      "id": "unique-id",
      "category": "technology",
      "source": "Publisher Name",
      "title": "Story title",
      "description": "Short summary",
      "publishedAt": "2026-09-29T10:00:00.000Z",
      "url": "https://publisher.example/story",
      "imageUrl": "https://publisher.example/image.jpg"
    }
  ],
  "updatedAt": "2026-09-29T10:00:00.000Z"
}
```

The React Query hook refreshes the feed every 15 minutes, including while the page is in the background where supported by the browser.

## Important

The current change is **frontend-only**. The live external-source aggregator/API is not created here. Until `/api/news-feeds` is implemented on the CollegeBook backend, the page displays a small starter state explaining that the live feed connection is pending.

This separation is intentional: external RSS/API collection should happen on the backend so that source access, deduplication, filtering, caching, source policies and future moderation can be controlled centrally.

## Nigerian News

The News & Feeds page includes a dedicated **Nigerian News** tab. Selecting it calls `GET /api/news-feeds/nigeria`, which is filtered by the backend to `country=ng` and `language=en`. The existing page layout, cards, search, refresh behavior, and other categories remain unchanged.

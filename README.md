# OpenNovels — write & read free original stories (MIT)

Free, open platform where **anyone can publish a novel** and anyone can read. Authors own their work (CC-BY default). No manga, no scraping — text stories only.

## Run locally (Node 18+)
```bash
cd backend && npm install
cd ../frontend && npm install
# terminal 1:
cd ../backend && node src/server.js      # http://localhost:5000
# terminal 2 (frontend):
npm run dev                              # http://localhost:5173
# optional seed (needs MongoDB):
npm run seed
```
No database? App runs in **in-memory demo mode** automatically.

Env: copy `backend/.env.example` → `backend/.env`, set `JWT_SECRET`.

## Core flows
- **Read:** Home → Browse/search/genres → story page → chapter reader (font size, progress bar, keyboard ←/→, continue reading).
- **Write:** Join free → `/write` → create story (title, synopsis, genres, license) → manage page → publish chapters one by one → readers find it in browse/search.
- **Library:** bookmark stories, track progress %, history in profile. Admin can feature stories.

## API
`GET /api/novels`, `GET /api/novels/:slug`, `GET /api/novels/:id/chapters`, `POST /api/novels` (auth), `PATCH /api/novels/:id` (author), `GET/POST/PATCH /api/chapters`, `POST /api/auth/register|login`, `GET /api/auth/me`, `GET/POST/DELETE /api/library*`, `GET/POST /api/progress*`, `GET /api/search?q=`, `GET /api/genres`.

## License
Code: MIT (`LICENSE`). Stories: owned by authors under their chosen license.

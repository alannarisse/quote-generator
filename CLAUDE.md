# Quote Generator

## Prompt

This is to create a quote generator app. This will be used for a weekly newsletter that constantly needs fresh quotes as part of the newsletter. This app will do the following:
- Keep a dataset of quotes from movies, tv shows and other sources
  - Dataset should include name of source, quotes from the source, the person(s) who said the quote (allow for 3), and a notes field for extra information
  - More than one quote can be stored for any given source
  - A contributor field to keep track of who contributed it
  - There should be a field for tags. and you should be able to add up to 8 tags per quote
- Allow a way for people to add more quotes via a form
- Allow a way to mark off when a quote was used.
- Allow easy 'copy to clipboard' button from the app 
- It can be viewed by anyone but requires a password for adding or deleting quotes, or marking them as used.
- There should be a randomize button that lets you choose from a random quote.
- If you don't like the random quote you've been given, you can click the randomize button as many times as you like.
- The quotes should be sortable by source, person, or tag.


Tech Stack
- I'd like this built in angular
- I'd like to use railway for the database
- I'd like to host it on Vercel


Railway info:
- I can add information about my railway account here


Vercel info:
- my vercel account is here https://vercel.com/alanna-risses-projects
- I can add information about my vercel account here.

---

## Implementation Details

### Database Schema (PostgreSQL)

```sql
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(255) NOT NULL,
  quote_text TEXT NOT NULL,
  speaker_1 VARCHAR(255),
  speaker_2 VARCHAR(255),
  speaker_3 VARCHAR(255),
  notes TEXT,
  contributor VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

- `GET /api/quotes` - List quotes (with filters: source, speaker, tag, unused)
- `GET /api/quotes/random` - Random unused quote
- `GET /api/quotes/tags` - All unique tags
- `GET /api/quotes/sources` - All unique sources
- `POST /api/quotes` - Add quote (password required)
- `PATCH /api/quotes/:id/used` - Mark as used (password required)
- `PATCH /api/quotes/:id/unuse` - Unmark (password required)
- `DELETE /api/quotes/:id` - Delete quote (password required)

### Local Development

```bash
# Backend (port 3000)
cd backend && npm install && npm run dev

# Frontend (port 4200)
cd frontend && npm install && npm start
```

### Environment Variables (backend/.env)

```
DATABASE_URL=postgresql://...
APP_PASSWORD=your-password
PORT=3000
```
<p align="center">
  <a href="https://www.classbop.com">
    <img src="public/brand/classbop-logo-purple.png" width="420" alt="ClassBop logo" />
  </a>
</p>

<h1 align="center">ClassBop</h1>

<p align="center">
  <strong>No-prep classroom games and teacher tools for the screen your class already watches.</strong>
</p>

<p align="center">
  ClassBop helps teachers launch lively, projector-friendly games, printable activities, and custom learning materials in seconds.
</p>

<p align="center">
  <a href="https://www.classbop.com"><img src="https://img.shields.io/badge/Live%20MVP-classbop.com-6D5DF6?style=for-the-badge" alt="Visit classbop.com" /></a>
  <img src="https://img.shields.io/badge/President%20Tech%20Award-2026-009FE3?style=for-the-badge" alt="President Tech Award 2026 submission" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-Powered-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Powered by Supabase" />
</p>

<p align="center">
  <a href="https://www.classbop.com">Live MVP</a>
  ·
  <a href="#-features">Features</a>
  ·
  <a href="#-getting-started">Getting started</a>
  ·
  <a href="#-contributing">Contributing</a>
</p>

## About ClassBop

ClassBop is a lightweight classroom engagement platform built for busy teachers. Open it on a classroom monitor or projector, choose a game or activity, and start playing—without preparing another slide deck.

The experience is designed around real classroom needs:

- Quick to launch and easy to operate while teaching
- Clear and readable from the back of the room
- Playable without an account; sign-in is reserved for creating and saving content
- Friendly to team games, warm-ups, review rounds, and lesson fillers
- Available in English, Korean, and Uzbek

## 🏆 Award submission

This repository is the public technical snapshot prepared for the **President
Tech Award 2026 — Incubation Track**. It demonstrates the product architecture,
classroom game engines, creator workflows, printable generators, localization,
authentication integration, and database security policies behind the live MVP.

- **Live product:** [www.classbop.com](https://www.classbop.com)
- **Category:** EdTech
- **Stage:** Working MVP / pre-seed
- **Core problem:** teachers lose valuable time repeatedly preparing slides,
  worksheets, and classroom review activities
- **ClassBop's solution:** one projector-first toolbox that launches engaging,
  reusable classroom experiences in seconds

Production secrets and deployment-specific values are intentionally excluded.
Public games and printable tools are available in the codebase without an
account; cloud creation, authentication, and realtime control require a
configured Supabase development project.

## ✨ Features

### Classroom games

| Experience | What it offers |
| --- | --- |
| **Quiz-Bop** | Team quiz boards, open-answer and multiple-choice questions, built-in scoring, custom quiz creation, and shareable public or private sets |
| **Class Feud** | Survey-style boards, hidden answer reveals, team scoring, typed or voice input, forgiving answer matching, and a custom board builder |
| **Pictionary** | Ready-made and teacher-created prompt categories, team scores, timers, private prompt display, and QR-based control from a teacher's phone |
| **Guess The Price** | Public and custom product decks, multi-currency support, configurable rounds, timers, team scoreboards, animated reveals, sound, and winner screens |

### Activities and printables

| Activity | What it offers |
| --- | --- |
| **Bingo** | Unique 2×2 through 5×5 cards, flexible print layouts, branded PDF export, and a no-repeat live picker |
| **Lyrics Play** | Song search, configurable fill-in-the-blank worksheets, and printable student and answer sheets |
| **Crossword Maker** | Custom vocabulary and clues, automatic layouts, live previews, and PDF worksheets with answer keys |
| **Word Search Maker** | Adjustable grids and directions, regenerated layouts, answer highlighting, and print-ready puzzles |

### Platform capabilities

- Email/password and Google authentication through Supabase
- Teacher profiles, avatars, creator attribution, and personal content libraries
- Public/private content controls and shareable links
- Supabase Realtime sessions for teacher-phone game control
- Responsive, projector-first interfaces with animation and sound
- Local draft persistence for supported creators
- Internationalized UI with automatic language detection

> [!NOTE]
> AI-assisted Quiz-Bop generation currently uses a local mock implementation. Homework Maker and Test Maker are interface previews, while Spelling Bee and Musical Chairs are marked as coming soon.

## 🧰 Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router 7 |
| Build tooling | Vite 8, ESLint 10 |
| Backend | Supabase Auth, Postgres, Row Level Security, and Realtime |
| UI and motion | CSS, Framer Motion, Lucide React |
| Documents | jsPDF |
| Classroom control | QRCode and Supabase Realtime |
| Hosting | Vercel |

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) `20.19+` or `22.12+`
- npm

### Installation

```bash
git clone https://github.com/shahzodjabbarov/classbop-award-submission.git
cd classbop-award-submission
npm ci
npm run build
npm run dev
```

Vite will print the local development URL, which is usually `http://localhost:5173`.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

## ⚙️ Configuration

### Supabase

Copy the example environment file before enabling cloud-backed features:

```bash
cp .env.example .env.local
```

Then provide `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. The browser client is initialized in
[`src/supabaseClient.js`](src/supabaseClient.js). Never place a Supabase secret
or service-role key in frontend code.

Database definitions, RLS policies, and incremental migrations are stored in [`supabase/`](supabase/). Review each SQL file's header before applying it in the Supabase SQL Editor; some scripts update tables or policies created by earlier project setup.

For authentication, enable the required providers in Supabase and add both your local URL and production domain to the allowed redirect URLs.

### Optional media search

Set a GIPHY key to enable GIF search in supported content builders:

```bash
# .env.local
VITE_GIPHY_API_KEY=your_public_api_key
```

Do not commit private credentials or server-side secrets to the repository.

## 📁 Project structure

```text
.
├── public/                 # Brand assets, thumbnails, audio, and static media
├── src/
│   ├── auth/               # Authentication context, guards, and utilities
│   ├── components/         # Shared navigation, menus, cards, and controls
│   ├── games/              # Game data, session logic, builders, and helpers
│   ├── i18n/               # English, Korean, and Uzbek translations
│   ├── pages/              # Route-level screens and game experiences
│   ├── tools/              # Printable generation and layout utilities
│   ├── App.jsx             # Routes and application shell
│   └── supabaseClient.js   # Supabase browser client
├── supabase/               # Database migrations and security policies
├── vercel.json             # SPA routing and production security headers
└── vite.config.js          # Vite configuration
```

## 🌐 Deployment

The repository is configured for Vercel. The included [`vercel.json`](vercel.json) provides single-page application rewrites and production security headers.

Before deploying:

1. Run `npm run lint` and `npm run build`.
2. Add the Supabase URL and publishable key to the hosting environment.
3. Add `VITE_GIPHY_API_KEY` if media search is required.
4. Add the production URL to Supabase Auth redirect settings.
5. Point the deployment to the generated `dist/` directory if your host does not detect Vite automatically.

## 🤝 Contributing

Thoughtful contributions are welcome. For substantial changes, open an issue first so the approach can be discussed.

1. Fork the repository and create a focused branch.
2. Keep public play fast and low-friction.
3. Design game screens for projector readability and quick teacher control.
4. Run lint and a production build before opening a pull request.
5. Include screenshots or a short recording for visible UI changes.

## Product principles

- **Seconds to start:** teachers should be able to launch an activity immediately.
- **Projector first:** important content and controls must remain readable across a classroom.
- **Teacher controlled:** scoring, reveals, timers, and navigation should be fast and forgiving.
- **Useful beyond demos:** every feature should support a real teaching workflow.
- **Playful, not complicated:** ClassBop is a classroom toolbox—not a heavy learning management system.

## License

Copyright © 2026 Shaxzodbek Jabbarov. All rights reserved.

This public repository is provided for evaluation and portfolio review. No
permission is granted to copy, redistribute, sublicense, or commercially use
the source code unless the project owner provides written permission.

---

<p align="center">
  Made for teachers who want less setup and more classroom energy.<br />
  <a href="https://www.classbop.com"><strong>classbop.com →</strong></a>
</p>

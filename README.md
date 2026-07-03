# 🎲 Speluitleg — Frontend

A Vue 3 SPA for browsing and editing simplified game rules.

## 🛠️ Tech Stack

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript**
- **Vite** dev server & bundler
- **Tailwind CSS 3** (dark theme)
- **Pinia** state management (auth store)
- **Vue Router** with an auth guard on edit routes
- **Axios** API client (JWT attached via interceptor)
- **marked** for rendering markdown rule bodies

## 📁 Structure

```
src/
├── components/   # MarkdownText.vue
├── router/       # routes + auth guard
├── services/     # api.ts, games.ts, types.ts
├── stores/       # auth.ts (Pinia)
├── views/        # Home, GameDetail, GameEdit, Login, Register
├── App.vue       # app shell (nav + footer)
└── main.ts
```

## 🚀 Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server proxies `/api` → `http://localhost:5080` (the backend), configured in
`vite.config.ts`. Start the backend first.

Build for production:

```bash
npm run build    # type-check (vue-tsc) + bundle to dist/
npm run preview
```

## 🔧 Environment

`.env`:

```
VITE_API_BASE_URL=/api
```

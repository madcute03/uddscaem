# News Portal Module (Laravel + Inertia)

This directory contains a modular news portal feature for Laravel applications. It ships with backend models, policies, controllers, migrations, and a React frontend built on Inertia.js.

## Installation

1. Copy contents of `news-portal-laravel/` into your Laravel project (or integrate via package/monorepo tooling).
2. Ensure Composer autoload picks up `App\Providers\AuthServiceProvider` and the policies.
3. Run database migrations:
   ```bash
   php artisan migrate
   ```
4. Install and build frontend assets:
   ```bash
   npm install
   npm run dev
   ```

## Environment

Add or confirm the following in `.env`:
```
APP_URL=http://localhost
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SESSION_DOMAIN=localhost
FILESYSTEM_DISK=public
```
Ensure `php artisan storage:link` is run for image uploads.

## Features

- Frontend layout (`resources/js/Layouts/AppLayout.jsx`) with shared components (headlines, sliders, cards).
- Public pages: `Home.jsx`, `Articles/Index.jsx`, `Articles/Show.jsx`.
- Admin pages: `Admin/Dashboard.jsx`, `Admin/Writers.jsx` (article management, writer roster).
- Models: `User`, `Article`, `Category` with relationships, scopes, and policies.
- Controllers for public/admin article management, categories, and writers.
- Sanctum-protected admin routes via `routes/web.php` under `/admin/*`.
- Rich media upload endpoint (`ArticleController::uploadRichMedia`).

## WYSIWYG Editor

Hook a client-side editor (e.g., Trix/Quill/CKEditor) to POST images to `route('admin.articles.upload')`; response returns `{ url }` for inserting media.

## TODO

- Wire editor interface in admin article create/edit screens.
- Configure verification emails for new writer invitations.
- Add policies to main `AuthServiceProvider` if integrating outside this module.
- Create seeder/factories for demo content.

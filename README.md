# Avengers Admin

Admin dashboard for the Avengers project, backed by the protected `/admin` API.

| Page             | What it does                                                         |
| ---------------- | -------------------------------------------------------------------- |
| Overview         | Revenue (7/30/90 days and all time), pending orders, customers, plus |
|                  | refunds required, low-stock variants and new messages                |
| Orders           | Filter by status, search by number/email/name; detail with lines and |
|                  | payment attempts (key codes are never shown)                         |
| Payments         | VNPay attempts; process owed full refunds through VNPay or record a  |
|                  | refund already completed manually                                    |
| Products         | Create and edit games, manage variants and prices, add encrypted     |
|                  | keys, see stock; publish or hide a game in the shop                  |
| Users            | Accounts with role, verification, order count and amount paid        |
| Contact messages | Inbox with status tracking (new / read / replied)                    |
| Home banners     | Create, edit, reorder, publish or delete the shop's home slides      |
| Blog posts       | Write and edit posts by category; publish, hide or delete them       |
| Comments         | Newest comments across posts, filterable by post; take one down      |
| FAQ & policies   | Edit and publish the FAQ, refund policy, terms and privacy pages     |
| Galleries        | Create, order, edit and publish image albums                         |
| Media library    | Manage screenshot and video items shown in the shop                  |
| Social links     | Manage the published links in the shop footer                        |
| Platforms        | Manage product platforms; deletion is blocked while variants use one |
| Categories       | Manage product and blog categories; deletion is blocked while used   |

Every image and video field takes either a pasted URL from any host or a file
uploaded to Cloudinary (images up to 10 MB, videos up to 100 MB). Files go
straight from the browser to Cloudinary with a signature from the API, which
keeps the Cloudinary secret; the **Upload** buttons appear only when the API
has Cloudinary configured. Replaced or deleted uploads are cleaned up by the
API once nothing uses them.

## Requirements

- Node.js 20.19 or later
- npm 10 or later
- The Avengers API running at `http://localhost:8000`

## Run locally

```sh
npm install
copy .env.example .env
npm run dev
```

The admin app runs at `http://localhost:3001`. Set `WEBPACK_API_URL` in `.env`
to the API base URL (including `/api/v1`). Add the admin origin to the API's
`CORS_ORIGINS` setting so credentialed requests and the refresh cookie work.

Sign in with an admin account whose email is verified. The API enforces admin
authorization independently of the client.

## Build

```sh
npm run build
```

Serve the generated `build` directory with SPA history fallback enabled.

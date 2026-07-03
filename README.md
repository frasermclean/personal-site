# Fraser McLean's Personal Website

![Fraser McLean's Personal Website](src/assets/default-og-image.png)

This repository contains the source code for my personal website, which serves as a platform to share my projects,
blog posts, and contact information. The website is built using Astro and hosted on Cloudflare Workers.

## Project Structure
- `images/`: Contains some image file formats that are used to create the images on the site. These files are not served directly, but are used to generate optimized images for the website.
- `public/`: Contains static content that is served directly, such as favicon images and the robots.txt file.
- `src/`: Contains the source code for the website, including components, pages, and styles.


## Local Development

The project relies on a few environment variables for local development. You can set these in a `.env` file at the root of the project:

```ini
# Email
CONTACT_EMAIL="contact@example.com"
RESEND_API_KEY="xxx"
OWNER_GITHUB_ID="123" # Unique identifier of the GitHub user who owns the site

# Umami Analytics
ANALYTICS_BASE_URL="http://localhost:8081" # Base URL for the analytics system
ANALYTICS_WEBSITE_ID="xxx" # Unique identifier of the site

# Cloudflare Turnstile
TURNSTILE_SITE_KEY="1x00000000000000000000AA" # Test key - always passes
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA" # Test key - always passes

# GitHub OAuth credentials
GITHUB_CLIENT_ID="xxx"
GITHUB_CLIENT_SECRET="xxx"
```

### Database Setup

The site uses a Cloudflare D1 database. On a new development machine, apply the migrations to create the local
database and its schema:

```sh
pnpm db:migrate
```

This creates the local D1 database under `.wrangler/state/v3/d1` and applies all migrations from the `migrations/`
directory. Re-run this command whenever a new migration is added.
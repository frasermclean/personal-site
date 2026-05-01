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

```env
CONTACT_EMAIL="contact@example.com"
RESEND_API_KEY="xxx"
TRACKING_WEBSITE_ID="xxx"
TRACKING_SCRIPT_SRC="http://localhost:8081/script.js"
TURNSTILE_SITE_KEY="xxx"
TURNSTILE_SECRET_KEY="xxx"
```
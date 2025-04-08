# Personal Website for Fraser McLean

This repository contains the source code for my personal website.
It is built using [Hugo](https://gohugo.io/) and hosted on [CloudFlare Pages](https://pages.cloudflare.com/).

## CloudFlare Pages development variables

Excluded by .gitignore is the .dev.vars file. This file is used to store the
CloudFlare Pages development variables and should be stored in the root of
the repository. The file should be structured as follows:

```plaintext
CONTACT_ADDRESS=email@example.com
RESEND_API_KEY=secret
TURNSTILE_SECRET_KEY=secret
```
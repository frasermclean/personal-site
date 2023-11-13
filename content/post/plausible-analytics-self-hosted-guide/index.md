---
title: 'Plausible Analytics Self Hosted Guide'
date: '2023-11-13T10:37:23+08:00'
draft: true
image: cover.jpg
tags: [ analytics, self-hosted, plausible ]
links:
  - title: PostgreSQL
    description: The World's Most Advanced Open Source Relational Database
    website: https://www.postgresql.org/
    image: https://www.postgresql.org/media/img/about/press/elephant.png
---

[Plausible Analytics](https://plausible.io/) is a lightweight and open-source web analytics tool. It doesn't use cookies and is fully compliant with GDPR, CCPA and PECR. It's a great alternative to Google Analytics.

## Prerequisites

- Your own domain name
- Access to a server with Docker Compose installed

## PostgreSQL database

Plausible Analytics uses [PostgreSQL](https://www.postgresql.org/) as its main database. We will create a new `compose.yml` file and add the following contents:

```yaml
services:
  # PostgreSQL database
  postgres:
    image: postgres:14-alpine
    restart: always
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  postgres-data:
```

The above defines a new service called `postgres` which uses the official PostgreSQL image. We are using the `14-alpine` tag which is the latest version supported by Plausible at the time of writing. We are also using a named volume called `postgres-data` to store the database files. This is so that we can easily upgrade the database in the future without losing any data.

### Environment variables

Under the environment section, we are using variables for the username and password. These need to be referenced from other services, so ideally we should set these in environment varibles. We will create a `.env` file in the same directory as the `compose.yml` file with the following contents:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=supersecretpassword # Change this to something more secure!
```

### Test the database

We can test the database by running the following commands:

```bash
docker compose up -d postgres
docker compose logs postgres
```
If the last line says: `database system is ready to accept connections`, then we are good to go!
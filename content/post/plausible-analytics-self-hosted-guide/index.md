---
title: 'Plausible Analytics self-hosted guide'
description: 'Self host your own privacy focussed website analytics tool'
date: '2023-12-14T9:11:23+08:00'
draft: false
image: cover.jpg
categories: [ guide ]
tags: [ analytics, self-hosted, plausible, docker, containers ]
links:
  - title: Plausible Analytivcs
    description: Easy to use and privacy-friendly Google Analytics alternative
    website: https://plausible.io/
    image: https://asset.brandfetch.io/id2ceYC7ck/idkMMiHKhK.png
  - title: PostgreSQL
    description: The World's Most Advanced Open Source Relational Database
    website: https://www.postgresql.org/
    image: https://asset.brandfetch.io/idjSeCeMle/idZol6htuN.svg
  - title: ClickHouse
    description: ClickHouse is the fastest and most resource efficient open-source database for real-time apps and analytics.
    website: https://clickhouse.tech/
    image: https://asset.brandfetch.io/idp4VufaPQ/idxv4ToAqd.jpeg
---

Wouldn't it be great to gain powerful insights into your website traffic without compromising your users' privacy?

[Plausible Analytics](https://plausible.io/) is a lightweight and open-source web analytics tool. It doesn't use cookies and is fully compliant with GDPR, CCPA and PECR. It's a great alternative to Google Analytics.

Plausible Analytics is available as a paid service, but you can also self-host it. I have written this guide to show you how to self-host Plausible Analytics on your own server using Docker Compose.

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

```
POSTGRES_USER=admin
POSTGRES_PASSWORD=supersecretpassword # Change this to something more secure!
```

### Test the database

We can test the database by running the following commands:

```bash
docker compose up -d postgres
docker compose logs postgres
```

![Postgres ready to accept connections](images/postgres-ready.png)
If the last line says: `database system is ready to accept connections`, then we are good to go!

## ClickHouse database

ClickHouse is another open-source database that Plausible Analytics uses for storing event data. We will need to define another service and volume in our existing `compose.yml` file: 

```yaml
services: 
  # Previously created services have been omitted

  # ClickHouse server
  clickhouse:
    image: clickhouse/clickhouse-server:23.3-alpine
    restart: always
    volumes:
      - clickhouse-data:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144

volumes:
  # Previously created volumes have been omitted
  clickhouse-data:
```

I have also added a `ulimits` section to increase the number of open files that ClickHouse can use. Please note that previously created services and volumes have been omitted for brevity.

## Plausible Analytics

We are now ready to add the Plausible Analytics service to our `compose.yml` file:

```yaml
services:
  # Previously created services have been omitted

  plausible:
    image: plausible/analytics:v2.0
    restart: always
    command: sh -c "sleep 10 && /entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
    depends_on:
      - postgres
      - clickhouse
    ports:
      - 8000:8000
    environment:
      - BASE_URL=https://analytics.yourdomain.com # Change this to your domain
      - SECRET_KEY_BASE=a0cd04ab7e053758bdd54a9437db97416a3021d5c2d7e847b15ee72006d1517f # Use `openssl rand -hex 64` to generate a new key
      - DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/plausible  # References environment variables defined in the postgres step
      - CLICKHOUSE_DATABASE_URL=http://clickhouse:8123/plausible_events
```

After adding the above, we can run another `docker compose up -d` in the same directory. This should bring up our Plausible Analytics instance on port 8000. We can test this by visiting `http://localhost:8000` in our browser. 

If everything went well, you should see a page similar to the following: ![Plausible Analaytics registration page](images/plausible-register.png)

This will give us a basic installation running unencrypted on our server on port 8000.

## Putting it all together

Here is the complete `compose.yml` file:

```yaml
name: plausible-analytics

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
  
  # ClickHouse server
  clickhouse:
    image: clickhouse/clickhouse-server:23.3-alpine
    restart: always
    volumes:
      - clickhouse-data:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
  
  # Plausible Analytics
  plausible:
    image: plausible/analytics:v2.0
    restart: always
    command: sh -c "sleep 10 && /entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
    depends_on:
      - postgres
      - clickhouse
    ports:
      - 8000:8000
    environment:
      - BASE_URL=https://analytics.yourdomain.com # Change this to your domain
      - SECRET_KEY_BASE=a0cd04ab7e053758bdd54a9437db97416a3021d5c2d7e847b15ee72006d1517f # Use `openssl rand -hex 64` to generate a new key
      - DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/plausible  # References environment variables defined in the postgres step
      - CLICKHOUSE_DATABASE_URL=http://clickhouse:8123/plausible_events

volumes:
  postgres-data:
    driver: local
  clickhouse-data:
    driver: local
```

If you prefer, I have provided a ZIP file containing the `compose.yml` file and `.env` file [here](plausible-analytics.zip).

## Closing thoughts

I hope you found this guide useful. I would highly recommend securing your server with a HTTPS reverse proxy but this is beyond the scope of this guide.

Plausible Analytics is an amazing open source project that deserves our support. Check our their [pricing page](https://plausible.io/#pricing) and consider supporting them if you can.

If you have any questions or feedback, please feel free to leave a comment below.
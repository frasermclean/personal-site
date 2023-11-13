---
title: 'Plausible Analytics self-hosted guide'
date: '2023-11-13T10:37:23+08:00'
draft: true
image: cover.jpg
tags: [ analytics, self-hosted, plausible ]
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

[Plausible Analytics](https://plausible.io/) is a lightweight and open-source web analytics tool. It doesn't use cookies and is fully compliant with GDPR, CCPA and PECR. It's a great alternative to Google Analytics.

Plausible Analytics is available as a paid service, but you can also self-host it. This guide will show you how to self-host Plausible Analytics on a server using Docker Compose.

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

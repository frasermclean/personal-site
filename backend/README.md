# Backend Services

This directory contains a Docker Compose configuration for the backend services of my personal website. The individual services include:

- **PostgreSQL Database**: A relational database used by other services to store data.
- **Redis Cache**: An in-memory data structure store used for caching and improving performance.
- **Umami Analytics**: A self-hosted web analytics service that provides insights into website traffic and user behavior.
- **Comentario**: A commenting system that allows users to leave comments on blog posts.

Start the backend services using the following command in the backend directory:

```bash
docker compose up -d
```

## PostgreSQL server

This server contains 2 databases, one for Umami and one for Comentario. There is an initialization script that creates the databases and users with the appropriate permissions. This script should be automatically executed when the database container is first started, and it will only run if the database is empty.

## Umami

The Umami analytics service is available at `http://localhost:8081`. You can log in with the default credentials:

- Username: admin
- Password: umami

You will need to add a site in the Umami dashboard to start collecting analytics data. Use `localhost:4321` as the domain. Take note of the generated website ID, as you will need to add it to your `.env` file.

## Comentario

The Comentario commenting system is available at `http://localhost:8080`. You can register a new account and that account will be set as an admin account.
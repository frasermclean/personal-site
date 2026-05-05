---
title: Docker Compose Environment Overrides
description: Walkthrough on how I use Docker Compose environment overrides to manage different configurations for development and production environments.
publishDate: 2026-05-04
heroImage: 
  src: shipping-containers.jpg
  alt: Shipping containers stacked on top of each other
category: guide
tags: ['docker', 'docker-compose', 'devops', 'deployment']
syndication:
  bubbles: https://bubbles.town/entry/158652
  mastodon: https://mastodon.social/@frasermclean/116521749848732290
  bluesky: https://bsky.app/profile/frasermclean.com/post/3ml43sp4mas2c
---

## Background

Recently, I was working on updating the backend logic of my personal site. I am using [Docker Compose](https://docs.docker.com/compose/) to manage my backend services. During development, it's easy to map ports to expose services to the host machine. However, in production, I want to avoid exposing ports directly and instead route traffic through a reverse proxy ([Traefik](https://traefik.io/traefik) in my case). As any good developer, I like to keep it [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself), so I was wondering if there might be a way to have different configurations for development and production without having to maintain separate `compose.yaml` files.

## Merge Compose Files

After some searching around, I discovered that Docker Compose actually supports [merging multiple compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/) together. With this very handy feature, it's possible to define a base `compose.yaml` file that contains the common configuration for both development and production, and then create override files with the specific configurations for each environment.

### Base Configuration

For demonstration purposes, let's say I have a base `compose.yaml` file that defines two services: `analytics` and `comments`. These services are used for analytics and comments functionality on my personal site, respectively. The base configuration might look something like this:

```yaml
services:
  # Umami analytics platform
  analytics:
    image: ghcr.io/umami-software/umami:latest
    container_name: backend-analytics
    restart: unless-stopped
    init: true
    environment:
      DATABASE_URL: postgresql://${UMAMI_DB_USER}:${UMAMI_DB_PASSWORD}@backend-database:5432/${UMAMI_DB_NAME}
      DATABASE_TYPE: postgresql
      REDIS_URL: redis://backend-cache:6379
      APP_SECRET: ${UMAMI_APP_SECRET}

  # Commentario comments system
  comments:
    image: registry.gitlab.com/comentario/comentario
    container_name: backend-comments
    restart: unless-stopped
    depends_on:
      database:
        condition: service_healthy
    environment:
      BASE_URL: http://localhost:8080
      SECRETS_FILE: /comentario/secrets.yaml
```

### Development Overrides

The default override file is `compose.override.yaml`, which is automatically applied when running `docker compose up`. In this file, I can add configurations specific to the development environment, such as port mappings to expose the services to the host machine:

```yaml
services:
  analytics:
    ports:
      - 8081:3000 # Exposes the analytics service on port 8081

  comments:
    ports:
      - 8080:80 # Exposes the comments service on port 8080
    volumes:
      - ./comentario-secrets.yml:/comentario/secrets.yaml:ro # Non-sensitive
```

### Production Overrides

In production, I don't use port mappings and the configuration for the comments service is stored in a different location. I can create a `compose.prod.yaml` file with the following content:

```yaml
services:
  analytics:
    networks:
      - default
      - proxy
    labels:
      - traefik.enable=true
      - traefik.http.routers.backend-analytics.rule=Host(`analytics.${DOMAIN}`)
      - traefik.http.services.backend-analytics.loadbalancer.server.port=3000

  comments:
    environment:
      BASE_URL: https://comments.${DOMAIN} # Will override the base URL defined in the base compose file
    networks:
      - default
      - proxy
    labels:
      - traefik.enable=true
      - traefik.http.routers.backend-comments.rule=Host(`comments.${DOMAIN}`)
      - traefik.http.services.backend-comments.loadbalancer.server.port=80
    volumes:
      - /etc/comentario/secrets.yaml:/comentario/secrets.yaml:ro

networks:
  default:
    name: backend
  proxy:
    name: proxy
    external: true
```

Additional labels and network configurations are added to route traffic through Traefik, and the port mappings are ommitted since the services will be accessed through the reverse proxy.

#### Deploying with Overrides
In order to use the production configuration, I can specify the override file when running the compose command:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## Conclusion

Using Docker Compose's support for multiple compose files and overrides allows me to maintain a single base configuration while easily switching between development and production settings. This approach keeps my configuration DRY and makes it easier to manage different environments without the need for duplicate files.

Hopefully, this walkthrough can help others who are looking for a way to manage different configurations for their Docker Compose setups. If you have any questions or suggestions, feel free to reach out!
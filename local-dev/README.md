# Personal Site - Local Development

This is a guide to setting up a local development environment for my personal site. This will enable Azurite to use HTTPS and allow for local development of the site.

## Prerequisites

* Docker
* mkcert

## Install CA

Run the following command to install the CA:

```bash
mkcert -install
```

## Create certificates for Azurite to use

Within the `local-dev` directory, run the following command to create the certificates:

```bash
mkcert --cert-file localhost.pem --key-file localhost-key.pem "localhost" "127.0.0.1" "::1"
```

## Start services

Within the `local-dev` directory, run the following command to start the services:

```bash
docker-compose up -d
```
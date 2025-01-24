---
title: 'Automate Entity Framework Core Migrations'
description: 'A guide on how to automate Entity Framework Core migrations in a GitHub Actions workflow'
date: '2025-01-24T10:36:09+08:00'
image: cover.jpg
tags: ['azure', 'azure-sql', 'github-actions', 'automation', 'entity-framework-core', 'migrations']
draft: true
---

## Introduction

When working with [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/), it's common practice to use migrations to manage changes to your database schema. As time goes by when you're working on your app, your initial database design might need to be updated. 

Migrations allow you to define changes to your database schema in code and apply them to your database. This is a powerful feature that can help you keep your database schema in sync with your codebase.

This concept is especially useful when working in a team environment, where multiple developers are working on the same codebase. Migrations allow you to easily share changes to the database schema with your team and have each developer apply those changes to their local database.

It becomes a little more tricky when you want those migrations applied to a shared database, such as a staging or production environment. In this guide, I'll show you how to automate the process of applying migrations to an [Azure SQL](https://azure.microsoft.com/en-us/products/azure-sql/database/) database using [GitHub Actions](https://github.com/features/actions).

## Pre-requisites

* A modern .NET (6+) project using Entity Framework Core
* Compatible databases (e.g., SQL Server, Azure SQL, PostgreSQL, etc.)
* The `dotnet-ef` tool installed. This can be installed using the following command:

```bash
dotnet tool install --global dotnet-ef
```

## Example project setup

For this guide, I'll be using 2 .NET projects:
* Api - An ASP.NET Core Web API project (the startup project)
* Infrastructure - A .NET Core class library project that contains the Entity Framework Core DbContext and migrations

Please note that many items are omitted for brevity.

```
📁 Api/
  📄 Api.csproj
📁 Infrastructure/
  📄 Infrastructure.csproj
  📁 Migrations/
    📄 20241216130225_Initial.cs
    📄 20250104015733_AddPostImage.cs
    📄 20250105042254_UpdateRoles.cs
```

## Manual migrations via Dotnet CLI

Before we dive into automating migrations, let's first understand how to apply migrations manually using the Dotnet CLI. It's important that this works locally, as essentially we'll be automating this process in the GitHub Actions workflow.

### Listing migrations

Sometimes, we just want to see what migrations are available. To list all available migrations, run the following command:

```bash
dotnet ef migrations list --project ./Infrastructure --startup-project ./Api
```

If everything is set up correctly, you should see an output something like this:

```
Build started...
Build succeeded.
20241216130225_Initial
20250104015733_AddPostImage
20250105042254_UpdateRoles
```

### Applying latest migration

To update to the latest migration, you may run the following command:

```bash
dotnet ef database update --project ./Infrastructure --startup-project ./Api
```

## Verify Azure SQL network configuration

Azure SQL has a firewall that needs to be configured to allow connections from public IP addresses. GitHub Actions runners have dynamic IP addresses, so you'll need to allow all Azure services to access your Azure SQL database. The easiest way to do this is via the Azure Portal.

1. Navigate to your Azure SQL database in the Azure Portal.
2. Click on the "Set server firewall" link. ![Click on the Set server firewall link](set-server-firewall.png)
3. Enable the "Allow Azure services and resources to access this server" checkbox. ![Allow Azure services and resources](allow-azure-services.png)

> Cover photo by [Pixabay](https://www.pexels.com/photo/flock-of-geese-ion-tilt-shift-lens-55832)
---
title: Automate Entity Framework Core migrations
description: A guide on how to automate Entity Framework Core migrations in a GitHub Actions workflow
date: '2025-01-24T10:36:09+08:00'
image: cover.jpg
categories: ['guide']
tags: ['azure', 'azure-sql', 'github-actions', 'automation', 'entity-framework-core', 'migrations', 'ci-cd']
draft: false
---

## Introduction

As time goes by when you're working on your app and adding new features, your initial database design might need to be updated. When working with [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/), it's common practice to use migrations to manage changes to your database schema.  

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

For this guide, I'll be using 2 .NET 9 projects:
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

### Building a migration script

The EF Core tooling allows you to generate a SQL script that represents the migrations that need to be applied to the database. This is useful if you want to review the changes before applying them to the database. Another useful feature it has is the `--idempotent` flag, which generates a script that can be run multiple times without causing errors if the migration has already been applied.

```bash
dotnet ef migrations script --output migrations.sql --idempotent --project ./Infrastructure --startup-project ./Api
```

## Verify Azure SQL network configuration

Azure SQL has a firewall that needs to be configured to allow connections from public IP addresses. GitHub Actions runners have dynamic IP addresses, so you'll need to allow all Azure services to access your Azure SQL database. The easiest way to do this is via the Azure Portal.

1. Navigate to your Azure SQL database in the Azure Portal.
2. Click on the "Set server firewall" link. ![Click on the Set server firewall link](set-server-firewall.png)
3. Enable the "Allow Azure services and resources to access this server" checkbox. ![Allow Azure services and resources](allow-azure-services.png)

## Create a GitHub Actions workflow

GitHub Actions allow you to automate tasks in your GitHub repository. In this case, we'll create a workflow that will run the migrations on an Azure SQL database. Ideally, these should happen after a successful build but before the application deployment. This way, you can ensure that the database schema is up-to-date before deploying your application.

### Create the workflow file

Create a new file in the `.github/workflows` directory of your repository. You may name your workflows however you like, however as this is part of a [CI/CD](https://en.wikipedia.org/wiki/CI/CD) process, I will name in `cicd.yml`. Below is an example of a simple workflow that checks out the code and builds the solution using the `dotnet build` command.

```yaml
name: CI/CD

on:
  push:
    branches:
      - main

jobs:
  build_deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    env:
      BUILD_CONFIGURATION: Release
    steps:
      # Checkout code from the repository
      - name: Checkout code
        uses: actions/checkout@v4

      # Setup .NET SDK
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 9
      
      # Install EF tool globally
      - name: Install EF tool
        run: dotnet tool install --global dotnet-ef

      # Build the solution using the supplied configuration
      - name: Build solution
        run: dotnet build --configuration ${{ env.BUILD_CONFIGURATION }}
```

It's important to note that the workflow will only trigger on pushes to the `main` branch. You can customize this to suit your needs.

### Add steps to run migrations

So far, so good. The workflow is building the solution, but we need to add steps to run the migrations. First we need to generate an SQL migration script, then we can run the script against the Azure SQL database.

```yaml
      # Build migrations script
      - name: Build migrations script
        run: >-
          dotnet ef migrations script
          --configuration ${{ env.BUILD_CONFIGURATION }}
          --idempotent
          --output ${{ github.workspace }}/migrations.sql
          --project Infrastructure
          --startup-project Api

      # Login to Azure
      - name: Login to Azure
        uses: azure/login@v2
        with:
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Deploy migrations script to Azure SQL database
      - name: Deploy migrations script
        uses: azure/sql-action@v2.3
        with:
          path: ${{ github.workspace }}/migrations.sql
          connection-string: ${{ secrets.DB_CONNECTION_STRING }}
```

#### Logging into Azure from GitHub Actions

To deploy the migration script to Azure SQL, we need to authenticate with Azure. This is done using the [Azure Login](https://github.com/marketplace/actions/azure-login) action. There are a few methods of authentication, but I prefer and recommend using a service principal with [federated identity credentials](https://learn.microsoft.com/en-us/graph/api/resources/federatedidentitycredentials-overview?view=graph-rest-1.0). This method doesn't require you to manage any passwords or secrets in GitHub Actions.

#### Deploying the migration script

The final step is to deploy the migration script to the Azure SQL database. This is done using the [Azure SQL Deploy](https://github.com/marketplace/actions/azure-sql-deploy) action. This action requires the path to the migration script and the connection string to the Azure SQL database. The connection string should be stored as a secret in your GitHub repository. This action has the handy feature of automatically managing the Azure SQL firewall rules for you. It will add the GitHub Actions runner IP address to the firewall rules before running the migration script and remove it afterwards.

### Final workflow file

Here is the complete workflow file that builds the solution, generates the migration script, logs into Azure, and deploys the migration script to the Azure SQL database. You would probably also want to add steps to deploy your application after the migrations have been applied.

```yaml
name: CI/CD

on:
  push:
    branches:
      - main

jobs:
  build_deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    env:
      BUILD_CONFIGURATION: Release
    steps:
      # Checkout code from the repository
      - name: Checkout code
        uses: actions/checkout@v4

      # Setup .NET SDK
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 9
      
      # Install EF tool globally
      - name: Install EF tool
        run: dotnet tool install --global dotnet-ef

      # Build the solution using the supplied configuration
      - name: Build solution
        run: dotnet build --configuration ${{ env.BUILD_CONFIGURATION }}

      # Build migrations script
      - name: Build migrations script
        run: >-
          dotnet ef migrations script
          --configuration ${{ env.BUILD_CONFIGURATION }}
          --idempotent
          --output ${{ github.workspace }}/migrations.sql
          --project Infrastructure
          --startup-project Api

      # Login to Azure
      - name: Login to Azure
        uses: azure/login@v2
        with:
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Deploy migrations script to Azure SQL database
      - name: Deploy migrations script
        uses: azure/sql-action@v2.3
        with:
          path: ${{ github.workspace }}/migrations.sql
          connection-string: ${{ secrets.DB_CONNECTION_STRING }}
```

## Conclusion

In this guide, we've learned how to automate Entity Framework Core migrations in a GitHub Actions workflow. This is a powerful feature that can help you keep your database schema in sync with your codebase and ensure that your database is up-to-date before deploying your application.

I hope you found this guide helpful and that you can apply these concepts to your own projects! Happy coding! 🚀

> Cover photo by [Pixabay](https://www.pexels.com/photo/flock-of-geese-ion-tilt-shift-lens-55832)
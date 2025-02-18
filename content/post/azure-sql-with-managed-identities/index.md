---
title: 'Azure SQL with managed identities'
date: '2025-02-18T12:45:08+08:00'
image: 'cover.png'
draft: true
categories: ['guide']
tags: ['azure', 'azure-sql', 'sql', 'automation', 'ci-cd', 'managed-identities', 'entra', 'github-actions', 'bicep']
---

## Introduction

In this guide, we will explore how to use managed identities to connect to Azure SQL Database. We will also look at how to automate the process of creating a new Azure SQL Database and setting up the necessary permissions for the managed identity.

## Azure SQL Database

![Azure SQL Database icon](database.png)

[Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql) is a fully managed relational database as a service offering provided by Microsoft. It is built on top of the venerable SQL Server engine.  It is a cloud-based service that is highly available, scalable, and secure. Azure SQL is a great choice for building modern applications that require a relational database.

## Managed identities

![Managed identity icon](mi.png)

[Managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) are a feature of [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/what-is-entra) that allows you to securely authenticate your applications and services without needing to manage credentials. Managed identities are a great way to secure your applications and services by eliminating the need to store credentials in your code or configuration files.

### Why use Managed Identities?

What this means in practice is that you can do away with storing connection strings, passwords, and other sensitive information in your code or configuration files. Instead, you can use managed identities to authenticate your applications and services to Azure resources.

## Create an Azure SQL Database using Bicep

We need to create a new Azure SQL Database to experiment with managed identities. We can use [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview) to define the infrastructure as code. Here is an example Bicep file that creates an Azure SQL Database:

{{< code language="bicep" source="/content/post/azure-sql-with-managed-identities/database.bicep" >}}

You can download the above Bicep file from [here](database.bicep).

## SQL Script

After creating the Azure SQL Database, we need to run a SQL script to set up the necessary permissions for the managed identity. Here is an example SQL script that grants the necessary permissions to the managed identity:

```sql
:setvar APP_PRINCIPAL_NAME "jobs-01-func"

IF NOT EXISTS (
  SELECT [name]
  FROM sys.database_principals
  WHERE [name] = '$(APP_PRINCIPAL_NAME)'
)
BEGIN
  CREATE USER [$(APP_PRINCIPAL_NAME)] FROM EXTERNAL PROVIDER;
  ALTER ROLE db_datareader ADD MEMBER [$(APP_PRINCIPAL_NAME)];
  ALTER ROLE db_datawriter ADD MEMBER [$(APP_PRINCIPAL_NAME)];
  ALTER ROLE db_ddladmin ADD MEMBER [$(APP_PRINCIPAL_NAME)];
END
```

In this script, we are creating a new user in the database for the managed identity and granting it the necessary permissions to read, write, and execute DDL statements on the database. The script makes use of `sqlcmd` variables to parameterize the name of the managed identity: `APP_PRINCIPAL_NAME`. This allows us to reuse the script for different identities.

> It's important to note that we are using the name of the managed identity as the name of the user in the database. In other Azure RBAC assignments, we would use the object ID of the managed identity. However, in the case of Azure SQL Database, we use the name of the managed identity as the user name in the database.

The variable `APP_PRINCIPAL_NAME` can be set using a few methods:
* It can be set using the `:setvar` command in `sqlcmd` mode. This is the method used in the script above.
* It can be set using the `-v` command-line option when running `sqlcmd`.
* It can be set from an environment variable. This is useful when running the script in an automated environment like GitHub Actions.
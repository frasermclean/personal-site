---
title: 'Azure SQL with Managed Identities'
date: '2025-02-18T12:45:08+08:00'
image: 'cover.png'
draft: true
categories: ['guide']
tags: ['azure', 'azure-sql', 'sql', 'automation', 'ci-cd', 'managed-identities', 'entra', 'github-actions', 'bicep']
---

## Introduction

In this guide, we will explore how to use Azure Managed Identities to connect to Azure SQL Database. We will also look at how to automate the process of creating a new Azure SQL Database and setting up the necessary permissions for the Managed Identity.

## Azure SQL Database

![Azure SQL Database icon](database.png)

[Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview?view=azuresql) is a fully managed relational database as a service offering provided by Microsoft. It is built on top of the venerable SQL Server engine.  It is a cloud-based service that is highly available, scalable, and secure. Azure SQL is a great choice for building modern applications that require a relational database.

## Managed Identities

![Managed Identity icon](mi.png)

[Managed Identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) are a feature of [Microsoft Entra](https://learn.microsoft.com/en-us/entra/fundamentals/what-is-entra) that allows you to securely authenticate your applications and services without needing to manage credentials. Managed Identities are a great way to secure your applications and services by eliminating the need to store credentials in your code or configuration files.

### Why use Managed Identities?

What this means in practice is that you can do away with storing connection strings, passwords, and other sensitive information in your code or configuration files. Instead, you can use Managed Identities to authenticate your applications and services to Azure resources.
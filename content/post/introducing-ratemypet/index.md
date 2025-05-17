---
title: Introducing RateMyPet
description: A social community site for sharing pet photos and stories
date: 2025-05-17T09:12:19+08:00
image: cover.jpg
hidden: false
comments: true
draft: false
categories: [ project ]
tags: [ 'pets', 'community', 'social', 'angular', 'aspnetcore', 'azure', 'github-actions' ]
---

## Introduction

For the past few months, I've been working on a new project called [RateMyPet](https://ratemy.pet). It's a social site where users can share photos and stories about their pets, and rate each other's pets. The idea is to create a fun and engaging community for pet lovers.

It's been a challenging but rewarding experience, and I'm excited to share it with you.

![Welcome page](screenshots/welcome.png)

I am still working on the project, and I plan to add more features in the future. But I wanted to share what I've done so far, and get some feedback from the community. Please feel free to reach out to me with any suggestions or comments.

Here is a link to the [RateMyPet](https://ratemy.pet) site. You can sign up for an account and start sharing your pet photos and stories right away.

![Latest posts](screenshots/posts.png)

## Technology Stack

I enjoy being a full-stack developer, and I love seeing how the frontend and backend work together to create a seamless user experience.

I was looking for a project to build while learning new technologies, and I thought this would be a great opportunity to do that. I wanted to create something that would be fun and engaging, and also give me a chance to learn new skills.

The entire project is open-source and contained in a single repository. It's available on [GitHub](https://github.com/frasermclean/ratemypet).

### Frontend - Angular

![Angular logo](logos/angular.png)

The frontend is built using [Angular](https://angular.dev) - my personal favorite JavaScript framework. I love Angular because it's a strongly opinionated framework that provides the developer a _**batteries included**_ approach to building modern web applications.

It has a powerful CLI, mandatory TypeScript, and a rich ecosystem of libraries and tools. I also love that it makes strong use of [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection), which I am used to from my experience with ASP.NET Core.

### Backend - ASP.NET Core API and Azure Functions

For the backend, I used ASP.NET Core Web API for the main API and Azure Functions for serverless functions. I chose ASP.NET Core because it's a powerful and flexible framework which has an amazing ecosystem. It allows me to build RESTful APIs quickly and easily, and it has great support for dependency injection, middleware, and other modern web development practices.

Azure Functions is a serverless compute service that allows me to run code in response to events. I used it for features that don't require an immediate response, such as sending emails and processing images. This allows me to offload some of the work from the main API and scale it independently.

### Database - Azure SQL Database

![Azure SQL logo](logos/azure-sql.png)

For the database, I settled upon Azure SQL Database. This meant that I could test locally using a SQL Server container, and then deploy to Azure SQL Database without any changes. I also used Entity Framework Core for data access, which is a powerful ORM that makes it easy to work with databases in .NET applications.

Another factor in my decision was cost. Azure SQL Database has a basic tier which is very affordable, and it allows me to scale up as needed. I also like that it has built-in support for backups, scaling, and other features that make it easy to manage.

### Deployment - GitHub Actions

![GitHub Actions logo](logos/github-actions.png)

For deployment, I used GitHub Actions to automate the build and deployment process. This allows me to easily deploy changes to the frontend and backend just merging a pull request. I set up workflows that build the frontend and backend, runs tests, and deploy to my Azure resources.

### Infrastructure - Azure

![Application architecture diagram](architecture.png)

For cloud infrastructure, I decided leverage my existing knowledge and use Azure. There are resources for everything I wanted and at a pricepoint that I could afford.

* **Frontend** - Azure Static Web Apps
* **Backend API** - Azure Container Apps
* **Backend Functions** - Azure Functions
* **Database** - Azure SQL Database
* **Storage** - Azure Storage
* **DNS** - Azure DNS
* **Analytics** - Azure Application Insights (the price for this could go up dramatically if the site gains popularity)

## Conclusion

I hope you enjoyed this introduction to RateMyPet. It's been a fun project to work on, and I'm excited to see where it goes. I plan to continue adding features and improving the site, so stay tuned for updates!
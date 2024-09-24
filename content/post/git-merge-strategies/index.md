---
title: Git merging strategies
description: A concise guide to git merge, rebase and squash
date: '2024-08-27T11:12:28+08:00'
draft: true
categories: [guide]
tags: [git, workflow]
---
## Introduction

When contributing to a git based repository, it's common practice to work in isolation on your own feature branch. At some point though, you'll want to merge your changes back into the main branch. This is where git merge strategies come into play.

![Main branch (blue) with feature branch (green)](feature-branch.png)

In the above diagram, the feature branch (green) contains changes that need to be merged back into the main branch (blue).

Git offers several ways to merge branches, each with its own pros and cons. In this guide, we'll cover the most common strategies: **merge**, **rebase** and **squash**.

## Merge

The simplest way to merge a branch is to use the `git merge` command. This creates a new commit on the target branch called the **merge commit** that combines the changes from the source branch into the target branch.

![Main branch with new merge commit (m5)](merge.png)

This stategy is useful when you want to preserve the history of the source branch. However, it can lead to a cluttered history with many merge commits. The feature branch is usually deleted after merging but this is not mandatory.

## Rebase

Rebasing is an alternative to merging that moves the commits from the source branch onto the tip of the target branch. This results in a linear history without any merge commits. It will create new commits with different hashes, so it's not recommended to rebase commits that have already been pushed to a public branch. This is because it can cause conflicts for other contributors.
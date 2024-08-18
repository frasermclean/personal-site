---
title: 'Protect your online identity with Fastmail'
description: 'Personal review of Fastmail email service.'
date: '2023-11-08T19:42:58+08:00'
draft: false
image: cover.jpg
aliases:
  - /2023/01/14/protect-your-online-identity-with-fastmail/
categories: [ review ]
tags: [ fastmail, email, privacy, dns ]
links:
  - title: Fastmail
    description: Privacy focussed email service
    website: https://www.fastmail.com
    image: https://www.fastmail.com/wp-content/uploads/2022/11/FM-Icon-RGB.png
---
After a series of recent data breaches by a few high-profile Australian businesses, I was looking for ways to protect my online identity as much as possible. I have been using a personal Gmail account for many years and have signed up to many online services using this single address. I run my own personal domain and was looking for a way to migrate my email to utilizing my domain.

After a bit of research, I came across [Fastmail](https://ref.fm/u29228064) – a privacy focused email hosting service. You can either have an address ending in `@fastmail.com` or use your own domain / domains. It has a really nice clean, ad-free user interface in my opinion. However, it is a premium service and you need to pay per user / mailbox. Sometimes paying for a quality product is worth it and they offered a 30 day no risk trial option, so I decided to give it a try.

## Domain Configuration

There is a bit of DNS work that needs to be done with any email hosting provider. Essentially you need to let other servers on the internet know about your hosting provider. This involves adding DNS records to your zone. The whole process was pretty painless, and I had the required records added to my DNS Zone in about 5 minutes.

For those using Azure DNS, I have created another [post]({{< ref  "/post/fastmail-dns-bicep" >}}) where I have created a Bicep template to automate the process.

## Migration from Gmail

I was one of the early adopters of Gmail so I had been using them for years and had 1000's of emails in my mailbox.

Importing them all was one thing that I thought was going to be painful to deal with, but it turned out to be a relative walk in the park. You need to have IMAP access enabled on your Gmail account. Then it is simply a matter of authorizing Fastmail to allow access to your Gmail messages and contacts. Depending on the amount of data in you Gmail account, it can take a little while. The whole process went off without a hitch for me. It imports any labels / folders you might have set up in Gmail.

## Masked Emails – Killer Feature

One of the absolute best features of Fastmail is one called **Masked Emails**. Essentially you can create a fully-functional, unique email address for each service that you have. Then update your contact information with each service to point to the new masked email address. You will still receive any mail sent to that address by the service. If you use the Fastmail web or mobile clients, you can reply using the masked email address. This way your real email address is never exposed. You can also decide to delete or stop receiving email from the masked email address at any time.

## Overall Impressions

It’s only been a couple of days, but I hugely impressed by the quality and ease-of-use of the Fastmail service. I didn’t need 30 days to evaluate the service – I basically signed up on day 2 😂.

I realize this whole post my sound like an advertisement. I have no affiliation with Fastmail or receive any compensation for this. I just think it’s a great product and wanted to share my experience.

That being said, if you do sign up then feel free to use my Fastmail [referral link](https://ref.fm/u29228064) and you will receive 10% off.

> This post was originally posted on my old WordPress site, but has been updated and migrated to this static site.
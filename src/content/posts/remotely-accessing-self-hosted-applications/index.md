---
title: Remotely accessing self-hosted applications
description: Comparison of private and public access methods for self-hosted applications, from VPNs and Tailscale to port forwarding and Cloudflare Tunnel.
publishDate: 2025-12-22T19:30:17+13:00
heroImage: 
  src: badger-laptop.jpg
  alt: A cute badger using a laptop
comments: true
tags: [ self-hosted, docker, homelab, networking, vpn, cloudflare, pangolin ]
---

## Introduction

I've been running a homelab in various forms for several years now, hosting applications such as file servers, media servers, home automation platforms, and development environments. One of the challenges I've faced over the years is determining the best way to access these applications, both from within my local network and remotely over the internet. 

While there are many options available, each comes with its own set of trade-offs in terms of security, ease of use, and cost. I wanted to share some of the methods I've explored for remotely accessing self-hosted applications, along with their pros and cons.

## Private Access Methods

In many cases, you may wish to keep your self-hosted applications private and only accessible to yourself or a select group of individuals. Here are some common private access methods:

### VPN (Virtual Private Network)

Used widely for secure remote access, a VPN allows you to create a secure connection to your homelab network from anywhere in the world. By connecting to the VPN, you can access your self-hosted applications as if you were on the local network. This method provides strong security and privacy, as all traffic is encrypted.

![Simplified VPN Diagram](vpn-example.png)

It's a great option if you predominantly access applications locally from trusted devices and only occasionally need remote access.

You will need to configure a VPN server on your homelab and install a VPN client on your remote device. A lot of popular consumer routers have built-in VPN server capabilities, or you can use dedicated software like [OpenVPN](https://openvpn.net) or [WireGuard](https://www.wireguard.com).

#### VPN Pros
- Strong security and privacy, as all traffic is encrypted.
- Access to the entire home network, allowing you to use local services and resources.
- No need to expose individual applications to the internet.

#### VPN Cons
- Requires publicly routable IP address and/or Dynamic DNS service to connect from outside your home network. If your ISP imposes CGNAT, VPN access may not be possible.
- VPN clients must be installed and configured on each remote device. The user of each remote device needs to initiate the VPN connection before accessing applications. This can be less convenient than other methods that provide direct access.
- Care should be taken around VPN client credentials as they can provide access to your entire home network if they are compromised.

### TailScale

[TailScale](https://tailscale.com) is a very popular modern VPN solution that greatly simplifies the process of creating a secure network between your devices. It uses the WireGuard protocol to provide encrypted connections between all your devices. Notably, it can get around CGNAT and firewall restrictions that typically hinder traditional VPNs. It is particularly well-suited for homelabs due to its ease of setup and use.

TailScale creates a virtual network adapter on each device and assigns each device a fixed unique IP address in the 100.x.x.x range, allowing them to communicate securely over the internet as if they were on the same local network.

![TailScale machines example](tailscale-machines.png)

In the example above, each device is connected to the TailScale network, allowing you to access the machine directly using its TailScale IP address (e.g. `100.121.214.63`) or MagicDNS (e.g. `lurker`) name.

#### TailScale Pros
- Extremely easy to set up and use, with minimal configuration required.
- Works seamlessly across different networks and firewalls, including CGNAT.
- Multiplatform support, including Windows, macOS, Linux, iOS, and Android.
  
#### TailScale Cons
- TailScale requires an account with TailScale, which is a third-party service. While the service is free for personal use with some limitations, it does introduce a dependency on an external provider.

## Public Access Methods

You may want to expose your self-hosted applications to the public internet. For example, you may want to share files or photos with friends or family, or provide access to a web application. In these cases, you can use one of the following methods:

### Port Forwarding

Port forwarding is the original and most straightforward method of exposing applications. It requires that you have a publicly accessible IP address and that you configure your router to forward incoming traffic on specific ports to the internal IP address and port of your self-hosted application. 

While this method is simple to set up, it has several drawbacks. It exposes your applications directly to the internet, which can be a security risk if not properly configured. Additionally, managing multiple applications can become cumbersome, as each application requires its own port forwarding rule.

#### Port Forwarding Considerations

- Poking holes in your firewall (opening ports) can expose your network to automated attacks from bots scanning for vulnerabilities. Ensure that any exposed services are kept up to date and secured with strong authentication.
- Dynamic IP addresses can complicate access. If your ISP changes your public IP address, you may need to use a Dynamic DNS service to keep track of your current IP.
- Reveals your public IP address, which can be a privacy concern.
- SSL/TLS encryption must be managed manually, often requiring the use of reverse proxies and certificate management tools like [Let's Encrypt](https://letsencrypt.org).

### Cloudflare Tunnel

[Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) (formerly known as Argo Tunnel) is a service that allows you to securely expose your self-hosted applications to the internet without opening any ports on your router. It achieves this by creating an outbound connection from your homelab to Cloudflare's network, which then routes incoming traffic to your application.

![Cloudflare Tunnel example](./cloudflare-tunnel-example.png)

As pictured in the example above, you need to define published application routes that map to your internal services.

Cloudflare Tunnel provides several benefits, including built-in DDoS protection, SSL encryption, and easy management through the Cloudflare dashboard. It also allows you to use custom domains and take advantage of Cloudflare's performance optimizations.

### Pangolin

[Pangolin](https://pangolin.net) is an open-source alternative to Cloudflare Tunnel that allows you to expose your self-hosted applications securely without opening ports on your router. Similar to Cloudflare Tunnel, Pangolin creates an outbound connection from your homelab to a public relay server, which then routes incoming traffic to your application.
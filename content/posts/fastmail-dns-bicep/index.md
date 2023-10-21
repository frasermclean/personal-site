---
title: 'Fastmail DNS Bicep Template'
date: '2023-10-21T12:30:02+11:00'
draft: false
tags: ['azure', 'bicep', 'fastmail', 'dns']
image: cover.jpg
---
## Introduction

If you're looking for a way to automate your [Azure DNS](https://azure.microsoft.com/en-us/products/dns)
record deployments for [Fastmail](https://www.fastmail.com), you've come to the right place.
This is a Bicep template that extended an existing DNS zone resource and adds the required MX, TXT and CNAME records for Fastmail.

## Usage

* The first parameter: `zoneName` is required and is the name of the existing DNS zone to reference.
* The second optional parameter, `recordTTL`, is the time to live for DNS records (in seconds). The default is 3600 seconds (1 hour).
* The third optional parameter, `existingTxtRecords`, is an array of existing text records that should be kept. The default is an empty array.

```bicep
targetScope = 'resourceGroup'

@description('Name of the DNS zone')
param zoneName string

@description('Time to live for DNS records (in seconds)')
param recordTTL int = 3600

@description('Existing text records to keep')
param existingTxtRecords array = []

var mxRecords = [
  {
    preference: 10
    exchange: 'in1-smtp.messagingengine.com'
  }
  {
    preference: 20
    exchange: 'in2-smtp.messagingengine.com'
  }
]

var txtRecords = [
  {
    value: [ 'v=spf1 include:spf.messagingengine.com ?all' ]
  }
]

var cnameRecords = [
  {
    name: 'mail'
    value: 'mail.fastmail.com' // webmail portal
  }
  {
    name: 'fm1._domainkey'
    value: 'fm1.${zoneName}.dkim.fmhosted.com'
  }
  {
    name: 'fm2._domainkey'
    value: 'fm2.${zoneName}.dkim.fmhosted.com'
  }
  {
    name: 'fm3._domainkey'
    value: 'fm3.${zoneName}.dkim.fmhosted.com'
  }
]

var srvRecords = [
  {
    name: '_submission._tcp'
    port: 587
    priority: 0
    target: 'smtp.fastmail.com'
    weight: 1
  }
  {
    name: '_imap._tcp'
    port: 0
    priority: 0
    target: '.'
    weight: 0
  }
  {
    name: '_imaps._tcp'
    port: 993
    priority: 0
    target: 'imap.fastmail.com'
    weight: 1
  }
  {
    name: '_pop3._tcp'
    port: 0
    priority: 0
    target: '.'
    weight: 0
  }
  {
    name: '_pop3s._tcp'
    port: 995
    priority: 10
    target: 'pop.fastmail.com'
    weight: 1
  }
  {
    name: '_jmap._tcp'
    port: 443
    priority: 0
    target: 'api.fastmail.com'
    weight: 1
  }
]

resource zone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: zoneName

  // mail exchange records
  resource mxRecord 'MX' = {
    name: '@'
    properties: {
      TTL: recordTTL
      MXRecords: [for record in mxRecords: {
        exchange: record.exchange
        preference: record.preference
      }]
    }
  }

  // text records
  resource txtRecord 'TXT' = {
    name: '@'
    properties: {
      TTL: recordTTL
      TXTRecords: concat(existingTxtRecords, txtRecords)
    }
  }

  // canonical name records
  resource cnameRecord 'CNAME' = [for record in cnameRecords: {
    name: record.name
    properties: {
      TTL: recordTTL
      CNAMERecord: {
        cname: record.value
      }
    }
  }]

  // service records
  resource serviceRecord 'SRV' = [for record in srvRecords: {
    name: record.name
    properties: {
      TTL: recordTTL
      SRVRecords: [
        {
          port: record.port
          priority: record.priority
          target: record.target
          weight: record.weight
        }
      ]
    }
  }]
}

```
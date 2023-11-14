targetScope = 'resourceGroup'

@description('Name of the workload')
param workload string

@description('Category of the workload')
param category string

@description('Location for resources within the resource group')
param location string = resourceGroup().location

@description('DNS zone name')
param domainName string

@description('Google site verification code')
param googleSiteVerification string

@allowed([ 'eastasia' ])
@description('Location of the static web app')
param staticWebAppLocation string

@description('Static web app custom domain verification code')
param customDomainVerification string

@description('Name of the public IP address for the comments host')
param commentsPublicIpName string

@description('Resource group of the public IP address for the comments host')
param commentsPublicIpResourceGroup string

@secure()
@minLength(32)
@description('Remark42 shared secret key used to sign JWT')
param remark42Secret string

var tags = {
  workload: workload
  category: category
}

resource kerriganPublicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' existing = {
  name: commentsPublicIpName
  scope: resourceGroup(commentsPublicIpResourceGroup)
}

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: domainName
  location: 'global'
  tags: tags

  resource txtRecords 'TXT' = {
    name: '@'
    properties: {
      TTL: 3600
      TXTRecords: [
        { value: [ customDomainVerification ] }
        { value: [ googleSiteVerification ] }
      ]
    }
  }

  resource apexARecord 'A' = {
    name: '@'
    properties: {
      TTL: 3600
      targetResource: {
        id: staticWebApp.id
      }
    }
  }

  resource wwwCnameRecord 'CNAME' = {
    name: 'www'
    properties: {
      TTL: 3600
      CNAMERecord: {
        cname: staticWebApp.properties.defaultHostname
      }
    }
  }

  resource commentsARecord 'A' = {
    name: 'comments'
    properties: {
      TTL: 3600
      targetResource: {
        id: kerriganPublicIp.id
      }
    }
  }
}

module fastmailDnsRecords 'fastmailDnsRecords.bicep' = {
  name: 'fastmailDnsRecords'
  params: {
    zoneName: dnsZone.name
    existingTxtRecords: dnsZone::txtRecords.properties.TXTRecords
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${workload}-${category}-swa'
  location: staticWebAppLocation
  tags: tags
  sku: {
    name: 'Free'
    size: 'Free'
  }
  properties: {}

  resource apexDomain 'customDomains' = {
    name: domainName
    properties: {
      validationMethod: 'dns-txt-token'
    }
  }

  resource wwwCustomDomain 'customDomains' = {
    name: 'www.${domainName}'
  }
}

module containerApps 'containerApps.bicep' = {
  name: 'containerApps'
  params: {
    workload: workload
    category: category
    location: location
    remark42Secret: remark42Secret
  }
}

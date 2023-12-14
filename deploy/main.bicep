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

var tags = {
  workload: workload
  category: category
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

// storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${workload}${category}'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }

  resource fileServices 'fileServices' = {
    name: 'default'

    resource commentsDataShare 'shares' = {
      name: 'comments-data'
      properties: {
        shareQuota: 8
      }
    }
  }
}

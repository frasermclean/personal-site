targetScope = 'resourceGroup'

@description('Name of the workload')
param workload string

@description('Category of the workload')
param category string

@description('DNS zone name')
param domainName string

@allowed([ 'eastasia' ])
@description('Location of the static web app')
param staticWebAppLocation string

var tags = {
  workload: workload
  category: category
}

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: domainName
  location: 'global'
  tags: tags
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
}

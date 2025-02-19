param location string = resourceGroup().location

@description('SQL Server administrator user display name.')
param adminName string

@description('SQL Server administrator user object ID.')
param adminObjectId string

var resourcePrefix = uniqueString(resourceGroup().id)

// azure sql server
resource sqlServer 'Microsoft.Sql/servers@2024-05-01-preview' = {
  name: '${resourcePrefix}-sql'
  location: location
  properties: {
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    version: '12.0'
    administrators: {
      administratorType: 'ActiveDirectory'
      azureADOnlyAuthentication: true // enforce use of managed identities
      principalType: 'User'
      login: adminName
      sid: adminObjectId
      tenantId: subscription().tenantId
    }
  }

  // azure sql database
  resource database 'databases' = {
    name: '${resourcePrefix}-sqldb'
    location: location
    sku: {
      name: 'Basic'
      tier: 'Basic'
      capacity: 5
    }
    properties: {
      collation: 'SQL_Latin1_General_CP1_CI_AS'
    }
  }

  // allow azure services to access the database
  resource allowAzureRule 'firewallRules' = {
    name: 'allow-azure-rule'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
}

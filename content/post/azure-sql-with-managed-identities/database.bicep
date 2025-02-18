param location string = resourceGroup().location

@description('The name of the user that will be the SQL Server administrator.')
param adminName string

@description('The object ID of the user that will be the SQL Server administrator.')
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
}

targetScope = 'resourceGroup'

@description('Name of the workload')
@minLength(4)
param workload string = 'frasermclean'

@description('Category of the workload')
@minLength(4)
param category string = 'cappstemp'

@description('Location for resources within the resource group')
param location string = resourceGroup().location

var tags = {
  workload: workload
  category: category
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${workload}${category}st'
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }

  resource fileServices 'fileServices' = {
    name: 'default'

    resource remark42DataShare 'shares' = {
      name: 'remark42-data'
      properties: {
        shareQuota: 8
      }
    }
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${workload}-${category}-law'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

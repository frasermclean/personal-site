targetScope = 'resourceGroup'

@description('Name of the workload')
@minLength(4)
@maxLength(12)
param workload string

@description('Category of the workload')
@minLength(4)
@maxLength(6)
param category string

@description('Location for resources within the resource group')
param location string = resourceGroup().location

@secure()
@minLength(32)
@description('Shared secret key used to sign JWT')
param remark42Secret string

var tags = {
  workload: workload
  category: category
}

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

// container apps environment
resource appsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${workload}-${category}-cae'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }

  resource commentsDataStorage 'storages' = {
    name: 'comments-data-storage'
    properties: {
      azureFile: {
        shareName: storageAccount::fileServices::commentsDataShare.name
        accessMode: 'ReadWrite'
        accountKey: storageAccount.listKeys().keys[0].value
        accountName: storageAccount.name
      }
    }
  }
}

resource comments 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${workload}-${category}-comments-ca'
  location: location
  tags: tags
  properties: {
    environmentId: appsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      secrets: [
        {
          name: 'remark42-secret'
          value: remark42Secret
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'remark42'
          image: 'docker.io/umputun/remark42:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'REMARK_URL'
              value: 'https://comments.frasermclean.com'
            }
            {
              name: 'SITE'
              value: 'frasermclean'
            }
            {
              name: 'SECRET'
              secretRef: 'remark42-secret'
            }
            {
              name: 'TIME_ZONE'
              value: 'Asia/Singapore'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'comments-data'
              mountPath: '/srv/var'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
      volumes: [
        {
          name: 'comments-data'
          storageName: appsEnvironment::commentsDataStorage.name
          storageType: 'AzureFile'
        }
      ]
    }
  }
}

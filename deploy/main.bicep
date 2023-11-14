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

var commentsAppName = '${workload}-${category}-comments-ca'

var commentsAppSecretNames = [
  'remark42-jwt-secret'
  'remark42-admin-ids'
  'remark42-auth-google-client-secret'
  'remark42-auth-github-client-secret'
  'remark42-auth-microsoft-client-secret'
  'remark42-smtp-username'
  'remark42-smtp-password'
]

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

  resource commentsCnameRecord 'CNAME' = {
    name: 'comments'
    properties: {
      TTL: 3600
      CNAMERecord: {
        cname: '${commentsAppName}.${appsEnvironment.properties.defaultDomain}'
      }
    }
  }

  resource commentsTxtRecord 'TXT' = {
    name: 'asuid.comments'
    properties: {
      TTL: 3600
      TXTRecords: [
        { value: [ appsEnvironment.properties.customDomainConfiguration.customDomainVerificationId ] }
      ]
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

// user assigned managed identity
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${workload}-${category}-id'
  location: location
  tags: tags
}

// key vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${workload}-${category}-kv'
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForTemplateDeployment: true
    sku: {
      family: 'A'
      name: 'standard'
    }
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

// log analytics workspace
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

  resource commentsCertificate 'managedCertificates' existing = {
    name: 'comments-cert'
  }
}

// remark42 comments container app
resource commentsApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: commentsAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
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
        customDomains: [
          {
            name: appsEnvironment::commentsCertificate.properties.subjectName
            bindingType: 'SniEnabled'
            certificateId: appsEnvironment::commentsCertificate.id
          }
        ]
      }
      secrets: [for name in commentsAppSecretNames: {
        name: replace(name, 'remark42-', '') // remove remark42- prefix
        identity: managedIdentity.id
        keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${name}'
      }]
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
              value: 'https://comments.${domainName}'
            }
            {
              name: 'SITE'
              value: 'frasermclean'
            }
            {
              name: 'SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'TIME_ZONE'
              value: 'Asia/Singapore'
            }
            {
              name: 'ADMIN_SHARED_ID'
              secretRef: 'admin-ids'
            }
            {
              name: 'ADMIN_SHARED_EMAIL'
              value: 'admin@${domainName}'
            }
            {
              name: 'AUTH_GOOGLE_CID'
              value: '551474988358-8vsq4t4frq5bv2f7lqgkp4eei4dkuk7t.apps.googleusercontent.com'
            }
            {
              name: 'AUTH_GOOGLE_CSEC'
              secretRef: 'auth-google-client-secret'
            }
            {
              name: 'AUTH_GITHUB_CID'
              value: 'f93d1abe0a16cca1040d'
            }
            {
              name: 'AUTH_GITHUB_CSEC'
              secretRef: 'auth-github-client-secret'
            }
            {
              name: 'AUTH_MICROSOFT_CID'
              value: '7530eab9-ce40-4c23-975d-58ff1d590920'
            }
            {
              name: 'AUTH_MICROSOFT_CSEC'
              secretRef: 'auth-github-client-secret'
            }
            {
              name: 'SMTP_HOST'
              value: 'smtp.fastmail.com'
            }
            {
              name: 'SMTP_PORT'
              value: '465'
            }
            {
              name: 'SMTP_TLS'
              value: 'true'
            }
            {
              name: 'SMTP_USERNAME'
              secretRef: 'smtp-username'
            }
            {
              name: 'SMTP_PASSWORD'
              secretRef: 'smtp-password'
            }
            {
              name: 'NOTIFY_ADMINS'
              value: 'email'
            }
            {
              name: 'NOTIFY_USERS'
              value: 'email'
            }
            {
              name: 'NOTIFY_EMAIL_FROM'
              value: 'no-reply@frasermclean.com'
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

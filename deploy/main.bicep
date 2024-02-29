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

@description('Name of the container registry')
param containerRegistryName string

@description('Name of the container image')
param containerImageName string

@description('Tag of the container image')
param containerImageTag string

@description('Reset the comments certificate. Useful on first deployment - should normally be false')
param resetCommentsCertificate bool

@description('Google project ID for reCAPTCHA')
param recaptchaGoogleProjectId string

@description('reCAPTCHA score threshold')
param recaptchaScoreThreshold string

@description('Attempt to assign roles - requires appropriate permissions')
param attemptRoleAssignments bool

var tags = {
  workload: workload
  category: category
}

var commentsAppName = '${workload}-${category}-comments-ca'
var containerRegistryLoginServer = '${containerRegistryName}.azurecr.io'

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

  resource remark42jwtSecret 'secrets' existing = {
    name: 'remark42-jwt-secret'
  }

  resource remark42adminIds 'secrets' existing = {
    name: 'remark42-admin-ids'
  }

  resource remark42authGoogleClientSecret 'secrets' existing = {
    name: 'remark42-auth-google-client-secret'
  }

  resource remark42authGithubClientSecret 'secrets' existing = {
    name: 'remark42-auth-github-client-secret'
  }

  resource remark42authMicrosoftClientSecret 'secrets' existing = {
    name: 'remark42-auth-microsoft-client-secret'
  }

  resource smtpUsername 'secrets' existing = {
    name: 'smtp-username'
  }

  resource smtpPassword 'secrets' existing = {
    name: 'smtp-password'
  }

  resource googleJsonCredentialsSecret 'secrets' existing = {
    name: 'google-json-credentials'
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

// application insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${workload}-${category}-appi'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
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

  resource commentsCertificate 'managedCertificates' = {
    name: 'comments-cert'
    location: location
    tags: tags
    properties: {
      subjectName: '${dnsZone::commentsCnameRecord.name}.${dnsZone.name}'
      domainControlValidation: 'CNAME'
    }
  }
}

// comments container app
resource commentsApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: commentsAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: appsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      maxInactiveRevisions: 3
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
            name: '${dnsZone::commentsCnameRecord.name}.${dnsZone.name}'
            bindingType: resetCommentsCertificate ? 'Disabled' : 'SniEnabled'
            certificateId: resetCommentsCertificate ? null : appsEnvironment::commentsCertificate.id
          }
        ]
      }
      registries: [
        {
          server: containerRegistryLoginServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'jwt-secret'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::remark42jwtSecret.name}'
        }
        {
          name: 'admin-ids'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::remark42adminIds.name}'
        }
        {
          name: 'auth-google-client-secret'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::remark42authGoogleClientSecret.name}'
        }
        {
          name: 'auth-github-client-secret'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::remark42authGithubClientSecret.name}'
        }
        {
          name: 'auth-microsoft-client-secret'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::remark42authMicrosoftClientSecret.name}'
        }
        {
          name: 'smtp-username'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::smtpUsername.name}'
        }
        {
          name: 'smtp-password'
          identity: 'system'
          keyVaultUrl: 'https://${keyVault.name}${environment().suffixes.keyvaultDns}/secrets/${keyVault::smtpPassword.name}'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'remark42'
          image: '${containerRegistryLoginServer}/${containerImageName}:${containerImageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
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

module functionApp 'functionApp.bicep' = {
  name: 'functionApp'
  params: {
    workload: workload
    category: category
    location: location
    tags: tags
    domainName: domainName
    storageAccountName: storageAccount.name
    keyVaultName: keyVault.name
    applicatioInsightsConnectionString: applicationInsights.properties.ConnectionString
    emailHost: 'smtp.fastmail.com'
    emailPort: 465
    emailRecipientName: 'Fraser McLean'
    recaptchaGoogleProjectId: recaptchaGoogleProjectId
    recaptchaScoreThreshold: recaptchaScoreThreshold
  }
}

module roleAssignments 'roleAssignments.bicep' = if (attemptRoleAssignments) {
  name: 'roleAssignments'
  params: {
    storageAccountName: storageAccount.name
    keyVaultName: keyVault.name
    commentsAppPrincipalId: commentsApp.identity.principalId
    functionAppPrincipalId: functionApp.outputs.principalId
  }
}

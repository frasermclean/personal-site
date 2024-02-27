targetScope = 'resourceGroup'

@description('Name of the workload')
param workload string

@description('Category of the workload')
param category string

@description('Location for resources within the resource group')
param location string = resourceGroup().location

@description('Tags for the resources')
param tags object

@description('Main domain name')
param domainName string

@description('Subdomain for the function app')
param subdomain string = 'func'

@description('Storage account name')
param storageAccountName string

@description('Name of the Key Vault')
param keyVaultName string

param applicatioInsightsConnectionString string

@description('SMTP server hostname')
param emailHost string

@description('SMTP server port number')
param emailPort int

@description('Email recipient name')
param emailRecipientName string

@description('Email recipient address')
param emailRecipientAddress string = 'contact@${domainName}'

@description('Google project ID for reCAPTCHA')
param recaptchaGoogleProjectId string

@description('reCAPTCHA score threshold')
param recaptchaScoreThreshold string = '0.5'

param resetCertificate bool = false

var functionAppCustomDomain = '${subdomain}.${domainName}'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName

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

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: domainName

  resource functionAppCnameRecord 'CNAME' = {
    name: subdomain
    properties: {
      TTL: 3600
      CNAMERecord: {
        cname: functionApp.properties.defaultHostName
      }
    }
  }

  resource functionAppTxtRecord 'TXT' = {
    name: 'asuid.${subdomain}'
    properties: {
      TTL: 3600
      TXTRecords: [
        { value: [ functionApp.properties.customDomainVerificationId ] }
      ]
    }
  }
}

// consumption app service plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${workload}-${category}-asp'
  location: location
  tags: tags
  sku: {
    name: 'Y1'
  }
  properties: {
    reserved: true
  }
}

// function app
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${workload}-${category}-func'
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      http20Enabled: true
      ftpsState: 'FtpsOnly'
      linuxFxVersion: 'DOTNET-ISOLATED|8.0'
      use32BitWorkerProcess: false
      cors: {
        allowedOrigins: [
          'https://www.${domainName}'
        ]
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage__accountName' // Use managed identity for storage account access: https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference?tabs=blob&pivots=programming-language-csharp#connecting-to-host-storage-with-an-identity
          value: storageAccountName
        }
        {
          name: 'AzureWebJobsStorage__credential'
          value: 'managedidentity'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'dotnet-isolated'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicatioInsightsConnectionString
        }
        {
          name: 'WEBSITE_USE_PLACEHOLDER_DOTNETISOLATED' // Improves cold start time: https://learn.microsoft.com/en-us/azure/azure-functions/functions-app-settings#website_use_placeholder_dotnetisolated
          value: '1'
        }
        {
          name: 'GOOGLE_JSON_CREDENTIALS'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${keyVault::googleJsonCredentialsSecret.name})'
        }
        {
          name: 'Recaptcha__GoogleProjectId'
          value: recaptchaGoogleProjectId
        }
        {
          name: 'Recaptcha__ScoreThreshold'
          value: recaptchaScoreThreshold
        }
        {
          name: 'Email__Username'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${keyVault::smtpUsername.name})'
        }
        {
          name: 'Email__Password'
          value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${keyVault::smtpPassword.name})'
        }
        {
          name: 'Email__Host'
          value: emailHost
        }
        {
          name: 'Email__Port'
          value: string(emailPort)
        }
        {
          name: 'Email__RecipientName'
          value: emailRecipientName
        }
        {
          name: 'Email__RecipientAddress'
          value: emailRecipientAddress
        }
      ]
    }
  }

  // custom domain
  resource hostNameBinding 'hostNameBindings' = {
    name: functionAppCustomDomain
    properties: {
      siteName: functionApp.name
      customHostNameDnsRecordType: 'CName'
      hostNameType: 'Verified'
      sslState: resetCertificate ? 'Disabled' : 'SniEnabled'
      thumbprint: resetCertificate ? null : functionAppCertificate.properties.thumbprint
    }
    dependsOn: [
      dnsZone::functionAppCnameRecord
      dnsZone::functionAppTxtRecord
    ]
  }
}

// managed certificate
resource functionAppCertificate 'Microsoft.Web/certificates@2023-01-01' = if (resetCertificate) {
  name: '${subdomain}-cert'
  location: location
  tags: tags
  properties: {
    canonicalName: functionAppCustomDomain
    serverFarmId: appServicePlan.id
  }
}

@description('Principal ID of the function app identity')
output principalId string = functionApp.identity.principalId

targetScope = 'resourceGroup'

@description('Name of the storage account')
param storageAccountName string

@description('Name of the key vault')
param keyVaultName string

@description('Principal ID of the function app')
param functionAppPrincipalId string

@description('Principal ID of the comments app')
param commentsAppPrincipalId string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

var storageAccountBlobDataOwnerRoleDefinitionId = resourceId('Microsoft.Authorization/roleDefinitions', 'b7e6dc6d-f1e8-4753-8033-0f276bb0955b')

var storageAccountRoleAssignmentData = [
  {
    principalId: functionAppPrincipalId
    roleDefinitionId: storageAccountBlobDataOwnerRoleDefinitionId
  }
]

// storage account role assignments
resource storageAccountRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for item in storageAccountRoleAssignmentData: {
  name: guid(storageAccount.id, item.roleDefinitionId, item.principalId)
  scope: storageAccount
  properties: {
    principalId: item.principalId
    roleDefinitionId: item.roleDefinitionId
  }
}]

var keyVaultSecretsUserRoleDefinitionId = resourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') 

var keyVaultRoleAssignmentData = [
  {
    principalId: functionAppPrincipalId
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
  }
  {
    principalId: commentsAppPrincipalId
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
  }
]

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// key vault role assignments
resource keyVaultRoleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for item in keyVaultRoleAssignmentData: {
  name: guid(keyVault.id, item.roleDefinitionId, item.principalId)
  scope: keyVault
  properties: {
    principalId: item.principalId
    roleDefinitionId: item.roleDefinitionId
  }
}]

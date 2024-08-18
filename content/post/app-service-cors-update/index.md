---
title: 'Azure App Service CORS update script'
description: 'PowerShell script to automate updating CORS settings on an Azure App Service based on the origins of a Static Web App'
date: '2024-01-30T11:29:55+08:00'
draft: false
image: cover.jpg
tags: ['azure', 'powershell', 'app-service', 'cors']
links:
  - title: Static Web Apps
    description: Azure Static Web Apps is a service that automatically builds and deploys full stack web apps to Azure from a GitHub repository.
    website: https://azure.microsoft.com/en-us/products/app-service/static
  - title: Azure App Service
    description: Azure App Service is an HTTP-based service for hosting web applications, REST APIs, and mobile back ends.
    website: https://azure.microsoft.com/en-us/products/app-service
---

## Introduction

Recently I have been working on creating a web application thats pairs Azure Static Web Apps with Azure App Service. Static Web Apps have a lot of cool features, such as the ability to spin up standalone [preview environments](https://learn.microsoft.com/en-us/azure/static-web-apps/preview-environments) when creating a pull request.

However, there is a small issue with this feature. When the preview environment is created, it given a semi random URL, which is not known until the environment is created. This means that if you want to call an API hosted on an App Service from the Static Web App, you need to add the URL of the preview environment to the CORS settings of the App Service. This is not a problem if you only have a few environments, but if you have a lot of environments, it can be a bit of a pain to add them all manually. So I decided to write a script to automate this process.

## What is CORS?

Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins (domain, scheme, or port) ther than its own from which a browser should permit loading resources. CORS also relies on a mechanism by which browsers make a "preflight" equest to the server hosting the cross-origin resource, in order to check that the server will permit the actual request. In that preflight, the rowser sends headers that indicate the HTTP method and headers that will be used in the actual request.

## The script

The script is written in PowerShell, and uses the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/) to interact with Azure. The script takes the name of the resource group that contains the App Service as a parameter, and then uses the Azure CLI to get the name of the App Service and the Static Web App. It then uses the Azure CLI to get the custom domains and environment hostnames from the Static Web App, and the currently active CORS origins from the App Service. It then compares the two lists, and adds any origins that are missing from the App Service, and removes any origins that are no longer in the Static Web App.

### Assumptions

* The script assumes that the Azure CLI is installed and configured and that you are logged in.
* The script assumes that the App Service and the Static Web App are in the same resource group.
* It also assumes that the Static Web App has already been deployed, and that the App Service has already been created.

### Script content

```powershell
param (
  [Parameter(Mandatory = $true)][string] $ResourceGroupName
)

function Get-StaticWebAppOrigins([string]$ResourceGroupName) {
  # Get the Static Web App name
  $appName = az staticwebapp list --resource-group adoptrix-demo-rg --query "[0].name" --output tsv
  Write-Host "Detected Static Web App name: $appName"

  # Read custom domains and environment hostnames
  [string[]]$customDomains = az staticwebapp show --name $appName --query "customDomains" | ConvertFrom-Json
  [string[]]$environmentHostnames = az staticwebapp environment list --name $appName --query "[].hostname" | ConvertFrom-Json

  $origins = $($customDomains + $environmentHostnames)
  | ForEach-Object { "https://$_" }
  | Sort-Object
  | Get-Unique

  Write-Host "Currently active origins in SWA: $($origins.Length)"

  return $origins
}

function Update-AppServiceCors([string]$ResourceGroupName, [string[]]$SwaOrigins) {
  # Get the App Service name
  $appName = az webapp list --resource-group $ResourceGroupName --query "[0].name" --output tsv
  Write-Host "Detected App Service name: $appName"

  # Get the currently active origins on the App Service
  $activeOrigins = (az webapp cors show --name $appName --resource-group $ResourceGroupName | ConvertFrom-Json).allowedOrigins
  $originsToAdd = $SwaOrigins | Where-Object { $activeOrigins -notcontains $_ }
  $originsToRemove = $activeOrigins | Where-Object { $SwaOrigins -notcontains $_ }
  $operationCount = 0

  $originsToAdd | ForEach-Object {
    Write-Host "Adding CORS origin: $_"
    az webapp cors add --name $AppName --resource-group $ResourceGroupName --allowed-origins $_ --output none
    $operationCount++
  }

  $originsToRemove | ForEach-Object {
    Write-Host "Removing CORS origin: $_"
    az webapp cors remove --name $AppName --resource-group $ResourceGroupName --allowed-origins $_ --output none
    $operationCount++
  }

  return $operationCount
}

$swaOrigins = Get-StaticWebAppOrigins -ResourceGroupName $ResourceGroupName
$operationCount = Update-AppServiceCors -ResourceGroupName $ResourceGroupName -SwaOrigins $swaOrigins

Write-Host "Completed CORS update with $operationCount operations."
```

### Usage

The script can be run from the command line like this:

```powershell
.\Update-AppServiceCors.ps1 -ResourceGroupName "YourResourceGroupName"
```

## Closing thoughts

Hope you find this script useful. If you have any questions or feedback, please leave a comment below!
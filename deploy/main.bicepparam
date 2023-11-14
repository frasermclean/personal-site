using 'main.bicep'

param workload = 'frasermclean'
param category = 'site'
param location = 'southeastasia'
param domainName = 'frasermclean.com'
param staticWebAppLocation = 'eastasia'
param customDomainVerification = '91135ldkvmc987ky3lr82mypn3brsy69'
param googleSiteVerification = 'google-site-verification=b_Qsl0HYr9Y5rPew78cllGSW_YKduu7KzvgdrEDbfDo'

// comments host
param commentsPublicIpName = 'kerrigan-pip'
param commentsPublicIpResourceGroup = 'vm-kerrigan-rg'

param remark42Secret = 'This should be replaced with a proper secret'

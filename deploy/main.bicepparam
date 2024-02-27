using 'main.bicep'

param workload = 'frasermclean'
param category = 'site'
param location = 'southeastasia'
param domainName = 'frasermclean.com'
param staticWebAppLocation = 'eastasia'
param customDomainVerification = 'sd37rt662lqyqg77pfnmh61ddqx44bxq'
param googleSiteVerification = 'google-site-verification=b_Qsl0HYr9Y5rPew78cllGSW_YKduu7KzvgdrEDbfDo'

// container registry
param containerRegistryName = 'snakebytecorecr'
param containerImageName = 'umputun/remark42'
param containerImageTag = 'latest'

param resetCommentsCertificate = false

// recaptcha settings
param recaptchaGoogleProjectId = 'fm-site-comments'
param recaptchaScoreThreshold = '0.5'

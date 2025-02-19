-- Change the name of the managed identity as needed
:setvar APP_PRINCIPAL_NAME "jobs-01-func"

-- Ensure the user doesn't already exist (idempotent)
IF NOT EXISTS (
  SELECT [name]
  FROM sys.database_principals
  WHERE [name] = '$(APP_PRINCIPAL_NAME)'
)
BEGIN
  CREATE USER [$(APP_PRINCIPAL_NAME)] FROM EXTERNAL PROVIDER;
  ALTER ROLE db_datareader ADD MEMBER [$(APP_PRINCIPAL_NAME)];
  ALTER ROLE db_datawriter ADD MEMBER [$(APP_PRINCIPAL_NAME)];
  ALTER ROLE db_ddladmin ADD MEMBER [$(APP_PRINCIPAL_NAME)];
END
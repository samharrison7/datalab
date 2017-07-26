import convict from 'convict';

const config = convict({
  apiPort: {
    doc: 'The port for the API service',
    format: 'port',
    default: 8000,
    env: 'PORT',
  },
  corsOrigin: {
    doc: 'The allowed origin for CORS',
    format: String,
    default: 'datalabs.nerc.ac.uk',
    env: 'CORS_ORIGIN',
  },
  vaultApi: {
    doc: 'The endpoint for Vault',
    format: 'url',
    default: 'http://localhost:8200',
    env: 'VAULT_API',
  },
  vaultAppRole: {
    doc: 'The Vault app role for the API',
    format: 'String',
    default: '29fd4305-e856-fe04-6c59-65e3d4936e34',
    env: 'VAULT_APP_ROLE',
  },
});

export default config;

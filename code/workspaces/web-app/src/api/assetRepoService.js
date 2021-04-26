import { gqlQuery, gqlMutation } from './graphqlClient';
import errorHandler from './graphqlErrorHandler';

function addRepoMetadata(metadata) {
  const mutation = `
    CreateCentralAssetMetadata($metadata: CentralAssetMetadataCreationRequest!) {
      createCentralAssetMetadata(metadata: $metadata) {
        assetId
      }
    }`;

  return gqlMutation(mutation, { metadata })
    .then(errorHandler('data.createCentralAssetMetadata.assetId'));
}

function editRepoMetadata(metadata) {
  // TODO - add back-end handling
  return Promise.resolve(metadata.assetId);
}

function loadVisibleAssets(projectKey) {
  const query = `
    CentralAssetsAvailableToProject($projectKey: String!) {
      centralAssetsAvailableToProject(projectKey: $projectKey) {
        assetId, name, version, fileLocation, visible, projects {key, name}
      }
    }`;

  return gqlQuery(query, { projectKey })
    .then(errorHandler('data.centralAssetsAvailableToProject'));
}

function loadAllAssets() {
  const query = `
    CentralAssets {
      centralAssets {
        assetId, name, version, fileLocation, masterUrl, owners {userId, name}, visible, projects {key, name}, registrationDate
      }
    }`;

  return gqlQuery(query)
    .then(errorHandler('data.centralAssets'));
}

export default {
  addRepoMetadata,
  editRepoMetadata,
  loadVisibleAssets,
  loadAllAssets,
};

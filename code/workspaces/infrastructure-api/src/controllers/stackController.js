import { body, check, matchedData } from 'express-validator';
import { isBoolean, indexOf } from 'lodash';
import { notebookList, stackList, siteList, versionList, NOTEBOOK_CATEGORY } from 'common/src/config/images';

import controllerHelper from './controllerHelper';
import stackRepository from '../dataaccess/stacksRepository';
import stackManager from '../stacks/stackManager';
import centralAssetRepoRepository from '../dataaccess/centralAssetRepoRepository';
import { visibility, getEnumValues } from '../models/stackEnums';
import { handleSharedChange } from '../stacks/shareStackManager';

const TYPE = 'stack';
const USER_UPDATEABLE_FIELDS = ['displayName', 'description', 'shared', 'assetIds'];
const STACK_SHARED_VALUES = ['private', 'project', 'public'];

function createStack(request, response) {
  const errorMessage = 'Invalid stack creation request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, createStackExec);
}

function restartStack(request, response) {
  const errorMessage = 'Invalid stack restart request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, restartStackExec);
}

const scaleDownStack = (request, response) => {
  const errorMessage = 'Invalid stack scale down request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, scaleDownStackExec);
};

const scaleUpStack = (request, response) => {
  const errorMessage = 'Invalid stack scale up request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, scaleUpStackExec);
};

function deleteStack(request, response) {
  const errorMessage = 'Invalid stack deletion request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, deleteStackExec);
}

function updateStack(request, response) {
  const errorMessage = 'Invalid stack update request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, updateStackExec);
}

function getOneById(request, response) {
  const errorMessage = 'Invalid stack fetch by ID request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, getOneByIdExec);
}

function getOneByName(request, response) {
  const errorMessage = 'Invalid stack fetch by Name request';
  return controllerHelper.validateAndExecute(request, response, errorMessage, getOneByNameExec);
}

function updateAccessTime(request, response) {
  const errorMessage = 'Invalid request to update access time';
  return controllerHelper.validateAndExecute(request, response, errorMessage, updateAccessTimeExec);
}

function getOneByIdExec(request, response) {
  // Build request params
  const { user } = request;
  const params = matchedData(request);

  // Handle request
  return stackRepository.getOneById(params.projectKey, user, params.id)
    .then(stack => response.send(stack))
    .catch(controllerHelper.handleError(response, 'matching ID for', TYPE, undefined));
}

function getOneByNameExec(request, response) {
  // Build request params
  const { user } = request;
  const params = matchedData(request);

  // Handle request
  return stackRepository.getOneByName(params.projectKey, user, params.name)
    .then(stack => response.send(stack))
    .catch(controllerHelper.handleError(response, 'matching Name for', TYPE, undefined));
}

async function createStackExec(request, response) {
  // Build request params
  const { user } = request;
  const params = matchedData(request);

  // Handle request
  await updateLinkedAssets(params, response);
  try {
    await stackManager.createStack(user, params);
    controllerHelper.sendSuccessfulCreation(response)();
  } catch (error) {
    controllerHelper.handleError(response, 'creating', TYPE, params.name)(error);
  }
}

async function updateStackExec(request, response) {
  // Build request params
  const { user, headers } = request;
  const params = matchedData(request);
  const { projectKey, name } = params;

  const updatedDetails = USER_UPDATEABLE_FIELDS.reduce(
    (previousValue, field) => (
      params[field] !== undefined
        ? { ...previousValue, [field]: params[field] }
        : previousValue
    ),
    {},
  );

  // Handle request
  await updateLinkedAssets(params, response);

  const existing = await stackRepository.getOneByName(projectKey, user, name);
  const { type, category } = existing;

  try {
    if (params.shared) {
      if (params.shared === visibility.PUBLIC && category === NOTEBOOK_CATEGORY) {
        response.status(405);
        return response.send({
          error: 'Cannot set notebooks to Public',
        });
      }
      const { authorization: userToken } = headers;

      // If the request changes the shared property, then handle the change accordingly.
      await handleSharedChange(params, existing, params.shared, userToken);
    }

    await stackManager.mountAssetsOnStack({ ...params, type });
    const updateResult = await stackRepository.update(projectKey, user, name, updatedDetails);
    return response.send(updateResult);
  } catch (error) {
    return controllerHelper.handleError(response, 'updating', TYPE, name)(error);
  }
}

function restartStackExec(request, response) {
  // Build request params
  const { user } = request;
  const params = matchedData(request);

  const { projectKey, name } = params;

  return stackRepository.userCanRestartStack(projectKey, user, name)
    .then((result) => {
      if (result) {
        // Handle request
        return stackManager.restartStack(params)
          .then(controllerHelper.sendSuccessfulRestart(response))
          .catch(controllerHelper.handleError(response, 'restarting', TYPE, params.name));
      }
      return Promise.reject(new Error('User cannot restart stack.'));
    })
    .catch(controllerHelper.handleError(response, 'restarting', TYPE, params.name));
}

const scaleDownStackExec = async (req, res) => {
  // Build request params
  const { user } = req;
  const params = matchedData(req);

  const { projectKey, name } = params;

  try {
    const canScaleStack = await stackRepository.userCanRestartStack(projectKey, user, name);
    if (!canScaleStack) {
      throw new Error('User cannot scale down stack.');
    }
    await stackManager.scaleDownStack(params);
    await stackRepository.resetAccessTime(projectKey, name);
    controllerHelper.sendSuccessfulScale(res);
  } catch (error) {
    controllerHelper.handleError(res, 'scaling down', TYPE, params.name)(error);
  }
};

const scaleUpStackExec = async (req, res) => {
  // Build request params
  const { user } = req;
  const params = matchedData(req);

  const { projectKey, name } = params;

  try {
    const canScaleStack = await stackRepository.userCanRestartStack(projectKey, user, name);
    if (!canScaleStack) {
      throw new Error('User cannot scale up stack.');
    }
    await stackManager.scaleUpStack(params);
    await stackRepository.updateAccessTimeToNow(projectKey, name);
    controllerHelper.sendSuccessfulScale(res);
  } catch (error) {
    controllerHelper.handleError(res, 'scaling up', TYPE, params.name)(error);
  }
};

function deleteStackExec(request, response) {
  // Build request params
  const { user } = request;
  const params = matchedData(request);

  const { projectKey, name } = params;

  return stackRepository.userCanDeleteStack(projectKey, user, name)
    .then((result) => {
      if (result) {
        // Handle request
        return stackManager.deleteStack(user, params)
          .then(controllerHelper.sendSuccessfulDeletion(response))
          .catch(controllerHelper.handleError(response, 'deleting', TYPE, params.name));
      }
      return Promise.reject(new Error('User cannot delete stack'));
    })
    .catch(controllerHelper.handleError(response, 'deleting', TYPE, params.name));
}

// eslint-disable-next-line consistent-return
async function updateLinkedAssets({ assetIds }, response) {
  if (!assetIds || assetIds.length === 0) return null;

  try {
    await centralAssetRepoRepository.setLastAddedDateToNow(assetIds);
  } catch (error) {
    controllerHelper.handleError(response, 'updating', centralAssetRepoRepository.TYPE, assetIds)(error);
  }
}

async function updateAccessTimeExec(request, response) {
  const params = matchedData(request);

  try {
    await stackRepository.updateAccessTimeToNow(params.projectKey, params.name);
    controllerHelper.sendSuccessfulAccessTimeUpdate(response);
  } catch (error) {
    controllerHelper.handleError(response, 'matching Name for', TYPE, undefined)(error);
  }
}

const checkExistsWithMsg = fieldName => check(fieldName).exists().withMessage(`${fieldName} must be specified`).trim();

const withIdValidator = [
  checkExistsWithMsg('id'),
  checkExistsWithMsg('projectKey'),
];

const withNameValidator = [
  checkExistsWithMsg('projectKey'),
  checkExistsWithMsg('name')
    .isAscii()
    .withMessage('Name must only use the characters a-z, 0-9')
    .isLength({ min: 4, max: 16 })
    .withMessage('Name must be 4-16 characters long'),
];

const deleteStackValidator = [
  ...withNameValidator,
  checkExistsWithMsg('type'),
];

const restartStackValidator = [
  ...withNameValidator,
  checkExistsWithMsg('type'),
];

const scaleStackValidator = [
  ...withNameValidator,
  checkExistsWithMsg('type'),
];

const updateStackValidator = [
  checkExistsWithMsg('name'),
  checkExistsWithMsg('projectKey'),
  ...USER_UPDATEABLE_FIELDS.map(field => body(field).optional({ nullable: true })),
  body('shared')
    .optional({ nullable: true })
    .isIn(STACK_SHARED_VALUES)
    .withMessage(`Value of "shared" must be one of: ${STACK_SHARED_VALUES.map(value => `"${value}"`).join(', ')}.`),
];

const createStackValidator = [
  ...deleteStackValidator,
  check('sourcePath', 'sourcePath must be specified for publication request')
    .custom((value, { req }) => {
      if (indexOf(siteList(), req.body.type) > -1) {
        return value;
      }
      return true;
    }),
  check('isPublic', 'isPublic boolean must be specified for publication request')
    .custom((value, { req }) => {
      if (indexOf(siteList(), req.body.type) > -1) {
        return isBoolean(value);
      }
      return true;
    }),
  check('visible', 'visible must be specified for sites')
    .custom((value, { req }) => {
      if (siteList().includes(req.body.type)) {
        return getEnumValues(visibility).includes(req.body.visible);
      }
      return true;
    }),
  check('shared', 'shared must be specified for notebooks')
    .custom((value, { req }) => {
      if (notebookList().includes(req.body.type)) {
        return getEnumValues(visibility).includes(req.body.shared);
      }
      return true;
    }),
  check('version', 'valid version must be specified')
    .optional()
    .custom((value, { req }) => {
      if (stackList().includes(req.body.type)) {
        return versionList(req.body.type).includes(value);
      }
      return true;
    })
    .withMessage((value, { req }) => `Must be one of ${versionList(req.body.type)}.`),
  checkExistsWithMsg('description'),
  checkExistsWithMsg('displayName'),
  checkExistsWithMsg('volumeMount'),
  body('assetIds').optional().isArray().withMessage('must be an array of strings.'),
  check('condaPath', 'condaPath must be a string if specified').optional().isString(),
  check('filename', 'filename must be a string if specified').optional().isString(),
];

const validators = {
  withIdValidator,
  withNameValidator,
  deleteStackValidator,
  createStackValidator,
  updateStackValidator,
  restartStackValidator,
  scaleStackValidator,
};

const controllers = { getOneById, getOneByName, createStack, restartStack, deleteStack, updateStack, scaleDownStack, scaleUpStack, updateAccessTime };

export default { ...validators, ...controllers };

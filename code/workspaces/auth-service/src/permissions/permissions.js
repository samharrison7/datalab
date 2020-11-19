import { permissionTypes } from 'common';
import fs from 'fs';
import yaml from 'js-yaml';
import config from '../config/config';

const { CATALOGUE_ADMIN_ROLE, CATALOGUE_EDITOR_ROLE, CATALOGUE_PUBLISHER_ROLE, INSTANCE_ADMIN_ROLE, SYSTEM, PROJECT_NAMESPACE } = permissionTypes;

const roleDelim = ':';

const permissionAttributes = yaml.safeLoad(fs.readFileSync(config.get('permissionAttributes')));

//    [ { role: 'admin', projectKey: 'project' } ]
// -> [ { role: 'admin', projectKey: 'project', permissions: [stackAttributes, storageAttributes, userAttributes] } ]
const getPermissions = roleObject => ({
  ...roleObject,
  permissions: permissionAttributes[roleObject.role] || [],
});

//    [ { role: 'admin', projectKey: 'project', permissions: [stackAttributes, storageAttributes, userAttributes] } ]
// -> [ { role: 'admin', projectKey: 'project', permissions: [/see permissions.yml/] } ]
const buildPermissions = ({ permissions, ...rest }) => ({
  ...rest,
  permissions: permissions.map(({ name, permissions: subPermissions }) => subPermissions.map(permission => name.concat(roleDelim, permission)))
    .reduce(flattenArray, []),
});

//    [ { role: 'admin', projectKey: 'project2', permissions: [/see permissions.yml/] } ]
// -> [ ['projects:project2:stacks:delete', ...] ]
const projectifyPermissions = ({ projectKey, permissions }) => {
  const prefix = projectKey ? `${PROJECT_NAMESPACE}${roleDelim}${projectKey}${roleDelim}` : '';
  return permissions.map(permission => prefix.concat(permission));
};

//    [ { role: 'instanceAdmin', permissions: [/see permissions.yml/] } ]
// -> [ ['system:instance:admin', ...] ]
const systemifyPermissions = ({ permissions }) => {
  const prefix = `${SYSTEM}${roleDelim}`;
  return permissions.map(permission => prefix.concat(permission));
};

const flattenArray = (previous, current) => {
  if (Array.isArray(current)) {
    return [...previous, ...current];
  }
  return previous;
};

const getSystemRoles = (userRoles) => {
  const instanceAdminRoles = userRoles[INSTANCE_ADMIN_ROLE] ? [{ role: INSTANCE_ADMIN_ROLE }] : [];
  const catalogueAdminRoles = userRoles[CATALOGUE_ADMIN_ROLE] ? [{ role: CATALOGUE_ADMIN_ROLE }] : [];
  const catalogueEditorRoles = userRoles[CATALOGUE_EDITOR_ROLE] ? [{ role: CATALOGUE_EDITOR_ROLE }] : [];
  const cataloguePublisherRoles = userRoles[CATALOGUE_PUBLISHER_ROLE] ? [{ role: CATALOGUE_PUBLISHER_ROLE }] : [];
  return [
    ...instanceAdminRoles,
    ...catalogueAdminRoles,
    ...catalogueEditorRoles,
    ...cataloguePublisherRoles,
  ];
};

const processRoles = (userRoles) => {
  const projectRoles = userRoles.projectRoles || [];
  const projectPermissions = projectRoles
    .map(getPermissions)
    .map(buildPermissions)
    .map(projectifyPermissions)
    .reduce(flattenArray, []);

  const systemRoles = getSystemRoles(userRoles);
  const systemPermissions = systemRoles
    .map(getPermissions)
    .map(buildPermissions)
    .map(systemifyPermissions)
    .reduce(flattenArray, []);

  return projectPermissions.concat(systemPermissions);
};

export default processRoles;

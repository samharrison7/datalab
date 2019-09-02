import httpMocks from 'node-mocks-http';
import projectController from './projectController';
import userRolesRepository from '../dataaccess/userRolesRepository';

jest.mock('../dataaccess/userRolesRepository');
const getProjectUsers = jest.fn();
const addRole = jest.fn();
userRolesRepository.getProjectUsers = getProjectUsers;
userRolesRepository.addRole = addRole;

describe('project controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('get project users', () => {
    it('should return mapped roles as JSON', async () => {
      getProjectUsers.mockReturnValue(Promise.resolve(rolesData()));
      const params = { params: { projectName: 'project' } };

      const request = httpMocks.createRequest(params);
      const response = httpMocks.createResponse();

      await projectController.getUserRoles(request, response);

      const expectedResponse = [
        { userId: 'user1', role: 'admin' },
        { userId: 'user2', role: 'viewer' },
      ];

      expect(response.statusCode).toBe(200);
      expect(response._getData()).toEqual(expectedResponse); // eslint-disable-line no-underscore-dangle
    });
  });

  describe('add user role', () => {
    it('should return 201 if role added', async () => {
      addRole.mockResolvedValue(true);
      const req = {
        params: { projectName: 'project', userId: 'uid1' },
        body: { role: 'admin' },
      };

      const request = httpMocks.createRequest(req);
      const response = httpMocks.createResponse();

      await projectController.addUserRole(request, response);

      expect(response.statusCode).toBe(201);
    });

    it('should return 200 if role edited', async () => {
      addRole.mockResolvedValue(false);
      const req = {
        params: { projectName: 'project', userId: 'uid1' },
        body: { role: 'admin' },
      };

      const request = httpMocks.createRequest(req);
      const response = httpMocks.createResponse();

      await projectController.addUserRole(request, response);

      expect(response.statusCode).toBe(200);
    });

    it('should return an error if add user role fails', async () => {
      addRole.mockRejectedValue('error');
      const req = {
        params: { projectName: 'project', userId: 'uid1' },
        body: { role: 'admin' },
      };

      const request = httpMocks.createRequest(req);
      const response = httpMocks.createResponse();

      try {
        await projectController.addUserRole(request, response);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toEqual('error');
      }
    });
  });
});

function rolesData() {
  return [
    {
      userId: 'user1',
      instanceAdmin: true,
      projectRoles: [
        { projectName: 'project', role: 'admin' },
        { projectName: 'project2', role: 'user' },
      ],
    },
    {
      userId: 'user2',
      instanceAdmin: true,
      projectRoles: [
        { projectName: 'project', role: 'viewer' },
        { projectName: 'project3', role: 'user' },
      ],
    },
  ];
}

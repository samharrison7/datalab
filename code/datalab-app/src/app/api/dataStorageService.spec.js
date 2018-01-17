import mockClient from './graphqlClient';
import dataStorageService from './dataStorageService';

jest.mock('./graphqlClient');

describe('dataStorageService', () => {
  beforeEach(() => mockClient.clearResult());

  describe('loadDataStorage', () => {
    it('should build the correct query and unpack the results', () => {
      mockClient.prepareSuccess({ dataStorage: 'expectedValue' });

      return dataStorageService.loadDataStorage().then((response) => {
        expect(response).toEqual('expectedValue');
        expect(mockClient.lastQuery()).toMatchSnapshot();
      });
    });

    it('should throw an error if the query fails', () => {
      mockClient.prepareFailure('error');

      return dataStorageService.loadDataStorage().catch((error) => {
        expect(error).toEqual({ error: 'error' });
      });
    });
  });

  describe('getCredentials', () => {
    it('should build the correct query and return the minio credentials', () => {
      const data = { dataStore: { url: 'expectedUrl', accessKey: 'expectedKey' } };
      const queryParams = { id: 'idValue' };
      mockClient.prepareSuccess(data);

      return dataStorageService.getCredentials(queryParams.id).then((response) => {
        expect(response).toEqual(data.dataStore);
        expect(mockClient.lastQuery()).toMatchSnapshot();
        expect(mockClient.lastOptions()).toEqual(queryParams);
      });
    });

    it('should throw an error if the query fails', () => {
      mockClient.prepareFailure('error');

      return dataStorageService.getCredentials().catch((error) => {
        expect(error).toEqual({ error: 'error' });
      });
    });
  });

  describe('checkDataStoreName', () => {
    it('should build the correct query and unpack the results', () => {
      const data = { checkDataStoreName: { id: 'abcd1234zyxw0987' } };
      const queryParams = { name: 'expectedName' };
      mockClient.prepareSuccess(data);

      return dataStorageService.checkDataStoreName(queryParams.name).then((response) => {
        expect(response).toEqual(data.checkDataStoreName);
        expect(mockClient.lastQuery()).toMatchSnapshot();
        expect(mockClient.lastOptions()).toEqual(queryParams);
      });
    });

    it('should throw an error if the query fails', () => {
      mockClient.prepareFailure('error');

      return dataStorageService.checkDataStoreName().catch((error) => {
        expect(error).toEqual({ error: 'error' });
      });
    });
  });

  describe('createDataStore', () => {
    it('should build the correct correct mutation and unpack the results', () => {
      const data = { dataStore: { name: 'name' } };
      mockClient.prepareSuccess(data);

      return dataStorageService.createDataStore(data.dataStore).then((response) => {
        expect(mockClient.lastQuery()).toMatchSnapshot();
        expect(mockClient.lastOptions()).toEqual(data);
      });
    });

    it('should throw an error if the mutation fails', () => {
      const data = { dataStore: { name: 'name' } };
      mockClient.prepareFailure('error');

      return dataStorageService.createDataStore(data.dataStore).catch((error) => {
        expect(error).toEqual({ error: 'error' });
      });
    });
  });

  describe('deleteDataStore', () => {
    it('should build the correct correct mutation and unpack the results', () => {
      const data = { dataStore: { name: 'name' } };
      mockClient.prepareSuccess(data);

      return dataStorageService.deleteDataStore(data.dataStore).then((response) => {
        expect(mockClient.lastQuery()).toMatchSnapshot();
        expect(mockClient.lastOptions()).toEqual(data);
      });
    });

    it('should throw an error if the mutation fails', () => {
      const data = { dataStore: { name: 'name' } };
      mockClient.prepareFailure('error');

      return dataStorageService.deleteDataStore(data.dataStore).catch((error) => {
        expect(error).toEqual({ error: 'error' });
      });
    });
  });
});

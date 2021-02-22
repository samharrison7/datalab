import useShallowSelector from './useShallowSelector';
import assetRepoSelectors from '../selectors/assetRepoSelectors';
import { useAssetRepo, useVisibleAssets } from './assetRepoHooks';

jest.mock('./useShallowSelector');

const publicAsset = { name: 'publicAsset', visible: 'PUBLIC', projects: [] };
const project1Asset = { name: 'project1Asset', visible: 'BY_PROJECT', projects: [{ key: 'project-1', name: 'project 1' }] };
const project2Asset = { name: 'project2Asset', visible: 'BY_PROJECT', projects: [{ key: 'project-2', name: 'project 2' }] };
const assetRepoState = { value: { assets: [publicAsset, project1Asset, project2Asset] } };
useShallowSelector.mockReturnValue(assetRepoState);
beforeEach(() => jest.clearAllMocks());

describe('useAssetRepo', () => {
  it('returns result of shallow selector with correct selector function', () => {
    // Act
    const hookResult = useAssetRepo();

    // Assert
    expect(useShallowSelector).toHaveBeenCalledTimes(1);
    expect(useShallowSelector).toHaveBeenCalledWith(assetRepoSelectors.assetRepo);
    expect(hookResult.value.assets).toEqual([project1Asset, project2Asset, publicAsset]);
  });
});

describe('useVisibleAssets', () => {
  it('returns visible assets', () => {
    // Act
    const hookResult = useVisibleAssets('project-1');

    // Assert
    expect(useShallowSelector).toHaveBeenCalledTimes(1);
    expect(useShallowSelector).toHaveBeenCalledWith(assetRepoSelectors.assetRepo);
    expect(hookResult.value.assets).toEqual([project1Asset, publicAsset]);
  });
});

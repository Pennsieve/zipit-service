import { Request } from 'express';
import { validateDiscoverRequest } from '../app/validators';

const discoverRequest = (data: object): Request =>
  (({ body: { data } } as unknown) as Request);

describe('validateDiscoverRequest', () => {
  const base = { datasetId: 1, version: 2, paths: ['files/a.csv', 'files/b.csv'] };

  it('sends no api_key for an anonymous (public dataset) request', () => {
    const { manifestUrl } = validateDiscoverRequest(discoverRequest(base));
    expect(manifestUrl).toMatch(/\/discover\/datasets\/1\/versions\/2\/files\/download-manifest$/);
    expect(manifestUrl).not.toContain('api_key');
  });

  it("passes the user's token when there is one (embargoed datasets)", () => {
    const { manifestUrl } = validateDiscoverRequest(
      discoverRequest({ ...base, userToken: 'abc.def-ghi' }),
    );
    expect(manifestUrl).toMatch(/download-manifest\?api_key=abc\.def-ghi$/);
  });
});

import axios from 'axios';
import { APP_URL, FILE_URL } from './_constants';

describe('integration test health check', () => {
  it('app server is running', async () => {
    const appHealth = await axios.get(`${APP_URL}/health`);
    expect(appHealth.status).toEqual(200);
  });
  it('test file server is running', async () => {
    const fileServerHealth = await axios.get(`${FILE_URL}/health`);
    expect(fileServerHealth.status).toEqual(204);
  });
});

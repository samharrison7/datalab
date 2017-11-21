import moment from 'moment';
import Cookies from 'universal-cookie';
import { getDomainInfo } from '../core/getDomainInfo';

const cookies = new Cookies('');
const COOKIE_NAME = 'authorization';

function storeAccessToken({ accessToken, expiresAt }) {
  const domainInfo = getDomainInfo();
  const options = { path: '/', expires: moment(expiresAt, 'x').toDate(), domain: `.${domainInfo.domain}` };

  cookies.set(COOKIE_NAME, accessToken, options);
}

function clearAccessToken() {
  const domainInfo = getDomainInfo();
  const options = { path: '/', domain: `.${domainInfo.domain}` };
  cookies.remove(COOKIE_NAME, options);
}

export default { storeAccessToken, clearAccessToken };

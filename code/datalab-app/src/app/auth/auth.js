import moment from 'moment';
import Promise from 'bluebird';
import auth0 from 'auth0-js';
import { pick } from 'lodash';
import authConfig from './authConfig';
import { setSession, clearSession, getSession } from '../core/sessionUtil';

class Auth {
  constructor(authZeroInit, promisifyAuthZeroInit) {
    this.authZeroInit = authZeroInit;
    this.authZeroAsync = promisifyAuthZeroInit;
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.renewSession = this.renewSession.bind(this);
    this.expiresIn = this.expiresIn.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getCurrentSession = this.getCurrentSession.bind(this);
  }

  login() {
    // User redirected to Auth0 login page
    const state = JSON.stringify({ appRedirect: window.location.pathname });
    this.authZeroInit.authorize({ state });
  }

  logout() {
    // User redirected to home page on logout
    clearSession();
    this.authZeroInit.logout({ returnTo: authConfig.returnTo });
  }

  handleAuthentication() {
    return this.authZeroAsync.parseHashAsync()
      .then(processHash);
  }

  renewSession() {
    const renewalAuthConfig = {
      ...pick(authConfig, ['audience', 'scope']),
      redirectUri: `${authConfig.returnTo}silent-callback`,
      usePostMessage: true,
    };
    // Attempt to renew token in an iframe
    return this.authZeroAsync.renewAuthAsync(renewalAuthConfig)
      .then(processHash)
      .catch(() => this.login()); // force login if renewAuth throws (user session expired)
  }

  expiresIn(expiresAt) {
    const expiresAtMoment = moment(expiresAt, 'x');
    if (!expiresAtMoment.isValid()) {
      throw new Error('Auth token expiresAt value is invalid.');
    }
    return expiresAtMoment.diff(moment.utc());
  }

  isAuthenticated(session) {
    if (session && session.expiresAt) {
      return this.expiresIn(session.expiresAt) > 0;
    }
    return false;
  }

  getCurrentSession() {
    const currentSession = getSession();
    return currentSession && processResponse(currentSession);
  }
}

function processHash(authResponse) {
  if (authResponse && authResponse.accessToken && authResponse.idToken) {
    const unpackedResponse = processResponse(authResponse);
    setSession(unpackedResponse);
    return unpackedResponse;
  }
  return null;
}

function processResponse(authResponse) {
  const state = processState(authResponse.state);
  const appRedirect = state ? state.appRedirect : undefined;
  const expiresAt = authResponse.expiresAt ? authResponse.expiresAt : expiresAtCalculator(authResponse.expiresIn);

  return {
    ...authResponse,
    appRedirect,
    expiresAt,
    state,
  };
}

function processState(state) {
  // auth0 silent renewal uses state parameter for a nonce value
  if (/appRedirect/.test(state)) {
    return JSON.parse(state);
  }
  return undefined;
}

function expiresAtCalculator(expiresIn) {
  return moment.utc().add(expiresIn, 's').format('x');
}

const AuthZero = new auth0.WebAuth(authConfig);
const PromisifyAuthZero = Promise.promisifyAll(AuthZero);
export default new Auth(AuthZero, PromisifyAuthZero);
export { Auth as PureAuth }; // export for testing

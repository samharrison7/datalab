import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { replace } from 'react-router-redux';
import { handleAuthentication } from '../../auth/Auth';
import authActions from '../../actions/authActions';

class CallbackContainer extends Component {
  componentWillMount() {
    if (/access_token|id_token|error/.test(this.props.urlHash)) {
      handleAuthentication().then((authResponse) => {
        this.props.actions.userLogsIn(authResponse);
        this.props.actions.routeTo(authResponse.appRedirect);
      });
    }
  }

  render() {
    // Redirect to home page if auth fails
    this.props.actions.routeTo('/');

    return (
      <div>
        <p>Redirecting...</p>
      </div>
    );
  }
}

function mapStateToProps({ router: { location: { hash } } }) {
  return {
    urlHash: hash,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({
      ...authActions,
      routeTo: replace,
    }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CallbackContainer);

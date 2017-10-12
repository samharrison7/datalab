import React, { Component } from 'react';
import { connect } from 'react-redux';
import NotebookCard from '../stacks/StackCard';

class PreviewNotebookCard extends Component {
  render() {
    return (
      <NotebookCard stack={this.props.stack} />
    );
  }
}

function mapStateToProps({ form }) {
  let stack = {};
  if (form && form.createNotebook && form.createNotebook.values) {
    stack = form.createNotebook.values;
  }
  return {
    stack,
  };
}

export { PreviewNotebookCard as PurePreviewNotebookCard }; // export for testing
export default connect(mapStateToProps)(PreviewNotebookCard);

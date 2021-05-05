import React from "react";
import { connect } from "react-redux";
import useAuth0 from "ui/utils/useAuth0";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import Modal from "ui/components/shared/Modal";

import "./LoginModal.css";

function LoginModal() {
  const { loginWithRedirect } = useAuth0();

  const onClick = e => {
    loginWithRedirect({ appState: { returnTo: window.location.href } });
  };

  return (
    <div className="login-modal">
      <Modal showClose={false}>
        <div className="px-8 py-4 space-y-6">
          <div className="place-content-center">
            <img className="w-16 h-16 mx-auto" src="images/logo.svg" />
          </div>
          <div className="text-center space-y-2">
            <div className="font-bold text-2xl">Sign in required</div>
            <div className="text-xl">You need to be signed in to leave a comment</div>
          </div>
          <div className="flex items-center flex-col">
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default connect(
  state => ({
    modal: selectors.getModal(state),
    recordingId: selectors.getRecordingId(state),
  }),
  { hideModal: actions.hideModal }
)(LoginModal);

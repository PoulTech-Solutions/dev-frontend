/** Minimal Google Identity Services typings for web sign-in. */
interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
    },
  ) => void;
}

interface Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        prompt: () => void;
      };
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { error?: string; access_token: string }) => void;
        }) => {
          requestAccessToken: () => void;
        };
      };
    };
  };
  gapi?: {
    load: (api: string, callback: () => void) => void;
    auth2: {
      getAuthInstance: () => {
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getName: () => string;
              getEmail: () => string;
              getImageUrl: () => string;
            };
          };
        };
      };
    };
    client: {
      init: (config?: any) => Promise<void>;
      load: (api: string, version: string) => Promise<void>;
      setToken: (token: { access_token: string }) => void;
      calendar: {
        events: {
          list: (params: any) => Promise<{
            result: {
              items: Array<{
                id: string;
                summary: string;
                description?: string;
                start: { dateTime?: string; date?: string };
                end: { dateTime?: string; date?: string };
              }>;
            };
          }>;
        };
      };
    };
  };
} 
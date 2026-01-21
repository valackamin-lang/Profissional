declare module 'passport-linkedin-oauth2' {
  import { Strategy } from 'passport';

  export interface Profile {
    id: string;
    displayName: string;
    name: {
      familyName: string;
      givenName: string;
    };
    emails: Array<{ value: string; type?: string }>;
    photos: Array<{ value: string }>;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
  }

  export class Strategy extends Strategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}

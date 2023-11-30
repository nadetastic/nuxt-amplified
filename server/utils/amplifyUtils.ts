import { H3Event, EventHandlerRequest } from "h3";
import {
  createKeyValueStorageFromCookieStorageAdapter,
  createUserPoolsTokenProvider,
  createAWSCredentialsAndIdentityIdProvider,
  runWithAmplifyServerContext,
} from "aws-amplify/adapter-core";
import {
  AmplifyServer,
  CookieStorage,
} from "@aws-amplify/core/internals/adapter-core";
import { parseAWSExports } from "@aws-amplify/core/internals/utils";

import type { LibraryOptions } from "@aws-amplify/core";
import config from "../../src/amplifyconfiguration.json";

const amplifyConfig = parseAWSExports(config);

const createCookieStorageAdapter = (
  event: H3Event<EventHandlerRequest>
): CookieStorage.Adapter => {
  // `parseCookies`, `setCookie` and `deleteCookie` are Nuxt provided functions
  const readOnlyCookies = parseCookies(event);

  return {
    get(name) {
      if (readOnlyCookies[name]) {
        return { name, value: readOnlyCookies[name] };
      }
    },
    set(name, value, options) {
      setCookie(event, name, value, options);
    },
    delete(name) {
      deleteCookie(event, name);
    },
    getAll() {
      return Object.entries(readOnlyCookies).map(([name, cookieRef]) => {
        return { name, value: cookieRef ?? undefined };
      });
    },
  };
};

const createLibraryOptions = (
  event: H3Event<EventHandlerRequest>
): LibraryOptions => {
  const cookieStorage = createCookieStorageAdapter(event);
  const keyValueStorage =
    createKeyValueStorageFromCookieStorageAdapter(cookieStorage);
  const tokenProvider = createUserPoolsTokenProvider(
    amplifyConfig.Auth!,
    keyValueStorage
  );
  const credentialsProvider = createAWSCredentialsAndIdentityIdProvider(
    amplifyConfig.Auth!,
    keyValueStorage
  );

  return {
    Auth: {
      tokenProvider,
      credentialsProvider,
    },
  };
};

export const runAmplifyApi = <Result>(
  event: H3Event<EventHandlerRequest>,
  operation: (
    contextSpec: AmplifyServer.ContextSpec
  ) => Result | Promise<Result>
) => {
  return runWithAmplifyServerContext<Result>(
    amplifyConfig,
    createLibraryOptions(event),
    operation
  );
};

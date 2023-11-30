import {
  createKeyValueStorageFromCookieStorageAdapter,
  createUserPoolsTokenProvider,
  createAWSCredentialsAndIdentityIdProvider,
  runWithAmplifyServerContext,
} from "aws-amplify/adapter-core";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth/server";
import { list } from "aws-amplify/storage/server";
import { parseAWSExports } from "@aws-amplify/core/internals/utils";
import type {
  LibraryOptions,
  FetchAuthSessionOptions,
} from "@aws-amplify/core";
import type { ListPaginateInput } from "aws-amplify/storage";
import config from "../src/amplifyconfiguration.json";

type CookieRef = ReturnType<typeof useCookie<string | null | undefined>>;

const amplifyConfig = parseAWSExports(config);
const userPoolClientId = amplifyConfig.Auth!.Cognito.userPoolClientId;
const lastAuthUserCookieName = `CognitoIdentityServiceProvider.${userPoolClientId}.LastAuthUser`;
const getAmplifyAuthKeys = (lastAuthUser: string) =>
  ["idToken", "accessToken", "refreshToken", "clockDrift"]
    .map(
      (key) =>
        `CognitoIdentityServiceProvider.${userPoolClientId}.${lastAuthUser}.${key}`
    )
    .concat(lastAuthUserCookieName);

export default defineNuxtPlugin({
  name: "AmplifyAPIs",
  enforce: "pre",
  setup() {
    // when setCookie is needed, set expirers as a year
    const expires = new Date();
    expires.setDate(expires.getDate() + 365);

    // get the last auth user cookie value
    const lastAuthUserCookie = useCookie(lastAuthUserCookieName, {
      sameSite: "lax",
      expires,
      secure: true,
    });

    // get all Amplify auth token cookie names
    const authKeys = getAmplifyAuthKeys(lastAuthUserCookie.value!);
    const amplifyCookies = authKeys
      .map((name) => ({
        name,
        cookieRef: useCookie(name, { sameSite: "lax", expires, secure: true }),
      }))
      .filter(
        (item): item is { name: string; cookieRef: CookieRef } =>
          item.cookieRef !== undefined
      )
      .reduce(
        (result, current) => ({
          ...result,
          [current.name]: current.cookieRef,
        }),
        {} as Record<string, CookieRef>
      );

    // create a key value storage based on the cookies
    const keyValueStorage = createKeyValueStorageFromCookieStorageAdapter({
      get(name) {
        const cookieRef = amplifyCookies[name];

        if (cookieRef && cookieRef.value) {
          return {
            name,
            value: cookieRef.value,
          };
        }

        return undefined;
      },
      getAll() {
        return Object.entries(amplifyCookies).map(([name, cookieRef]) => {
          return { name, value: cookieRef.value ?? undefined };
        });
      },
      set(name, value) {
        const cookieRef = amplifyCookies[name];
        if (cookieRef) {
          cookieRef.value = value;
        }
      },
      delete(name) {
        const cookieRef = amplifyCookies[name];

        if (cookieRef) {
          cookieRef.value = null;
        }
      },
    });

    // create a token provider
    const tokenProvider = createUserPoolsTokenProvider(
      amplifyConfig.Auth!,
      keyValueStorage
    );

    // create a credentials provider
    const credentialsProvider = createAWSCredentialsAndIdentityIdProvider(
      amplifyConfig.Auth!,
      keyValueStorage
    );

    // create the LibraryOptions object
    const LibraryOptions: LibraryOptions = {
      Auth: {
        tokenProvider,
        credentialsProvider,
      },
    };

    return {
      provide: {
        Amplify: {
          Auth: {
            fetchAuthSession: (options: FetchAuthSessionOptions) =>
              // run the `fetchAuthSession` API with in the server context
              // by passing necessary parameters
              runWithAmplifyServerContext(
                amplifyConfig,
                LibraryOptions,
                (contextSpec) => fetchAuthSession(contextSpec, options)
              ),
            fetchUserAttributes: () =>
              runWithAmplifyServerContext(
                amplifyConfig,
                LibraryOptions,
                (contextSpec) => fetchUserAttributes(contextSpec)
              ),
            getCurrentUser: () =>
              runWithAmplifyServerContext(
                amplifyConfig,
                LibraryOptions,
                (contextSpec) => getCurrentUser(contextSpec)
              ),
          },
          Storage: {
            list: (input: ListPaginateInput) =>
              runWithAmplifyServerContext(
                amplifyConfig,
                LibraryOptions,
                (contextSpec) => list(contextSpec, input)
              ),
          },
        },
      },
    };
  },
});

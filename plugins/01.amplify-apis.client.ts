import {
  fetchAuthSession,
  fetchUserAttributes,
  signIn,
  signOut,
  getCurrentUser,
} from "aws-amplify/auth";
import { list } from "aws-amplify/storage";

export default defineNuxtPlugin({
  name: "AmplifyAPIs",
  enforce: "pre",
  setup() {
    return {
      provide: {
        // You can more APIs here as needed
        // and you don't need to follow the object shape
        Amplify: {
          Auth: {
            fetchAuthSession,
            fetchUserAttributes,
            signIn,
            signOut,
            getCurrentUser,
          },
          Storage: {
            list,
          },
        },
      },
    };
  },
});

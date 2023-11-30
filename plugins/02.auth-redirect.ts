import { Amplify } from "aws-amplify";
import config from "../src/amplifyconfiguration.json";

// Since this file will run on both client and server, ensure
// the singleton `configure` function will only be called on the clinet side
if (process.client) {
  Amplify.configure(config, { ssr: true });
}

export default defineNuxtPlugin({
  name: "AmplifyAuthRedirect",
  enforce: "pre",
  setup() {
    addRouteMiddleware(
      "AmplifyAuthMiddleware",
      defineNuxtRouteMiddleware(async (to) => {
        try {
          const session = await useNuxtApp().$Amplify.Auth.fetchAuthSession();

          // If the request is not associated with a valid user session
          // redirect to the `/sign-in` route.
          // You can also add route match rules against `to.path`
          if (session.tokens === undefined && to.path !== "/sign-in") {
            return navigateTo("/sign-in");
          }

          if (session.tokens !== undefined && to.path === "/sign-in") {
            return navigateTo("/");
          }
        } catch (e) {
          console.log(e);
          // return navigateTo
          if (to.path !== "/sign-in") {
            return navigateTo("/sign-in");
          }
        }
      }),
      { global: true }
    );
  },
});

import { fetchAuthSession } from "aws-amplify/auth/server";

export default defineEventHandler(async (event) => {
  if (event.path.startsWith("/api")) {
    try {
      const session = await runAmplifyApi(event, (contextSpec) =>
        fetchAuthSession(contextSpec)
      );

      // You can add extra logic to match the requested routes to apply
      // the auth protection
      if (session.tokens === undefined) {
        setResponseStatus(event, 403);
        return {
          error: "Access denied!",
        };
      }
    } catch (error) {
      return {
        error: "Access denied!",
      };
    }
  }
});

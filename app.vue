<script setup>
import { Amplify } from "aws-amplify";
import config from "./src/amplifyconfiguration.json";

if (process.client) {
  (function configureAmplifyForClient() {
    console.log("Configuring Amplify on the client side");
    Amplify.configure(config, { ssr: true });
  })();
}
</script>
<template>
  <NuxtPage />
</template>

<script setup lang="ts">
const { data, error } = useAsyncData(async () => {
  try {
    const result = await useNuxtApp().$Amplify.Auth.getCurrentUser();
    return result;
  } catch (error) {
    return "Some error - " + error;
  }
});

const handleSignIn = async () => {
  try {
    const result = await useNuxtApp().$Amplify.Auth.signIn({
      username: "dkkiuna11@gmail.com",
      password: "abcd1234",
    });
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};
</script>

<template>
  <div>
    <!-- <pre>{{ data }}</pre> -->
    <h1>Hello</h1>
    <hr />
    <h3>Data</h3>
    <pre>{{ data }}</pre>
    <h3>Error</h3>
    <pre>{{ error }}</pre>
    <hr />
    <button @click="handleSignIn()">SignIn</button>
  </div>
</template>

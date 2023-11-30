<script setup lang="ts">
const { data, error } = useAsyncData(async () => {
  try {
    const result = await useNuxtApp().$Amplify.Auth.getCurrentUser();
    return result;
  } catch (error) {
    return "Some error - " + error;
  }
});
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
  </div>
</template>

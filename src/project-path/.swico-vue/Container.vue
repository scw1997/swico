<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
const error = ref<string | null>(null);
onErrorCaptured((err, instance, info) => {
    console.error(err);
    error.value = err.toString();
    return false;
});
</script>

<template>
    <Layout v-if="!error"><RouterView /></Layout>
</template>

<style scoped></style>

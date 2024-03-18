<script setup lang="ts">
defineProps<{ app: any; history: any }>();
</script>

<template>
    <div>
        <Layout :app :history><RouterView /></Layout>
    </div>
</template>

<style scoped></style>

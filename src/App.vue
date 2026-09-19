<script setup lang="ts">
import EnvironmentalMapPage from "@/features/environmental-map/EnvironmentalMapPage.vue";
import NotFoundPage from "@/features/not-found/NotFoundPage.vue";

const path = window.location.pathname;
const isAppNotFound = path !== "/" && path !== "/index.html" && !path.startsWith("/api/") && path !== "/api";
</script>

<template>
  <NotFoundPage v-if="isAppNotFound" />
  <EnvironmentalMapPage v-else />
</template>

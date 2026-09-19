import { createRouter, createWebHistory } from "vue-router";
import EnvironmentalMapPage from "@/features/environmental-map/EnvironmentalMapPage.vue";
import NotFoundPage from "@/features/not-found/NotFoundPage.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: EnvironmentalMapPage },
    { path: "/:pathMatch(.*)*", component: NotFoundPage },
  ],
});

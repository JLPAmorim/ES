/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from "vue-router/auto";
import { setupLayouts } from "virtual:generated-layouts";
import Register from "../pages/Register.vue";
import Login from "../pages/Login.vue";
import MyMessages from "../pages/MyMessages.vue";
import SendMessage from "../pages/SendMessage.vue";
import DeletedMessages from "../pages/DeletedMessages.vue";
import SentMessages from "../pages/SentMessages.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  extendRoutes: setupLayouts,
  routes: [
    {
      path: "/",
      name: "home",
      component: Register,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/mymessages",
      name: "mymessages",
      component: MyMessages,
    },
    {
      path: "/sendmessage",
      name: "sendmessage",
      component: SendMessage,
    },
    {
      path: "/deletedmessages",
      name: "deletedmessages",
      component: DeletedMessages,
    },
    {
      path: "/sentmessages",
      name: "sentmessages",
      component: SentMessages,
    },
  ],
});

export default router;

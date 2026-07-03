import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    {
      path: '/spel/:slug',
      name: 'game-detail',
      component: () => import('../views/GameDetailView.vue'),
      props: true,
    },
    {
      path: '/beheer/nieuw',
      name: 'game-new',
      component: () => import('../views/GameEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/beheer/spel/:slug',
      name: 'game-edit',
      component: () => import('../views/GameEditView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    { path: '/inloggen', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/registreren', name: 'register', component: () => import('../views/RegisterView.vue') },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 128 }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router

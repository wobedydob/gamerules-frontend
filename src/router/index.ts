import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    {
      path: '/games/new',
      name: 'game-new',
      component: () => import('../views/GameEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/games/:slug',
      name: 'game-detail',
      component: () => import('../views/GameDetailView.vue'),
      props: true,
    },
    {
      path: '/games/:slug/edit',
      name: 'game-edit',
      component: () => import('../views/GameEditView.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router

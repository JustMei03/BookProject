import { createRouter, createWebHistory } from 'vue-router';
import Descrizione from '../views/descrizione.vue';
import Autori from '../views/autori.vue';
import Ricerca from '../views/ricerca.vue';
import Login from '../views/login.vue';
import Impostazioni from '../views/impostazioni.vue';
import Lettore from '../views/lettore.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { hideNavbar: true }
},
  {
    path: '/descrizione/:id', 
    name: 'Descrizione',
    component: () => import('../views/descrizione.vue')
},
  {
    path: '/autore/:id',
    name: 'Autore',
    component: Autori
},
  {
    path: '/ricerca/:id',
    name: 'Ricerca',
    component: () => import('../views/ricerca.vue')
},
  {
    path: '/impostazioni',
    name: 'Impostazioni',
    component: Impostazioni
},
  {
    path: '/lettore',
    name: 'Lettore',
    component: Lettore
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
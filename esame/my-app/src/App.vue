<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { auth, db } from "./firestore.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const route = useRoute();
const iconaProfilo = ref("");

const getIconaUrl = (nomeIcona) => {
  return new URL(`./assets/${nomeIcona}.png`, import.meta.url).href;
};

const aggiornaStatoUtente = async (user) => {
  if (user) {
    iconaProfilo.value = user.photoURL || "";

    try {
      const userDoc = await getDoc(doc(db, "utenti", user.uid));
      if (userDoc.exists() && userDoc.data().theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    } catch (e) {
      console.error("Error with the mode:", e);
    }
  } else {
    iconaProfilo.value = "";
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    aggiornaStatoUtente(user);
  });
});

watch(() => route.path, () => {
  if (auth.currentUser) aggiornaStatoUtente(auth.currentUser);
});
</script>

<template>
  <div id="app">
    <header 
      v-if="!$route.meta.hideNavbar" 
      class="navbar navbar-expand-lg fixed-top bg-barra-scura py-3 text-dynamic"
      style="z-index: 9999;"
    >
      <div class="container">
        <router-link to="/ricerca/tutti" class="navbar-brand text-decoration-none">
          <h1 class="h3 m-0 fw-bold text-dynamic">BookProject</h1>
        </router-link>
 
        <div style="width: 120px;" class="text-end d-flex align-items-center justify-content-end">
          
          <router-link v-if="$route.path === '/lettore'" to="/impostazioni" class="text-decoration-none text-dynamic">
            <i class="material-symbols-outlined fs-2 align-middle" style="cursor: pointer;">settings</i>
          </router-link>

          <span v-else-if="$route.path === '/impostazioni'"></span>

          <router-link v-else to="/lettore" class="text-decoration-none text-dynamic">
            <img 
              v-if="iconaProfilo" 
              :src="getIconaUrl(iconaProfilo)" 
              class="rounded-circle object-fit-cover align-middle shadow-sm" 
              style="width: 32px; height: 32px; cursor: pointer;" 
              alt="Profilo"
            />
            <i v-else class="material-symbols-outlined fs-2 align-middle" style="cursor: pointer;">account_circle</i>
          </router-link>
          
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<style>
.main-content { padding-top: 110px !important; }
.bg-barra-scura { background-color: #98aad6; transition: background-color 0.3s; }
.text-dynamic { color: #1A2238; transition: color 0.3s; }

html.dark-mode .bg-barra-scura { background-color: var(--card-bg) !important; }
html.dark-mode .text-dynamic { color: #ffffff !important; }
</style>

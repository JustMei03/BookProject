<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { auth, db } from '../firestore.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

const preferiti = ref([]);
const username = ref("Caricamento...");
const iconaProfilo = ref("icona1");
let unsubscribePreferiti = null; 

const getIconaUrl = (nomeIcona) => {
  return new URL(`../assets/${nomeIcona}.png`, import.meta.url).href;
};

const ascoltaPreferitiUtente = (userId) => {
  const preferitiRef = collection(db, 'users', userId, 'preferiti');

  unsubscribePreferiti = onSnapshot(preferitiRef, async (snapshot) => {
    const listaId = [];
    snapshot.forEach((doc) => {
      listaId.push(doc.id); 
    });

    if (listaId.length === 0) {
      preferiti.value = [];
      return;
    }

    try {
      const richiestePromises = listaId.map(id => 
        axios.get(`https://openlibrary.org/works/${id}.json`)
          .then(res => {
            let coverId = null;
            if (res.data.covers && res.data.covers.length > 0 && res.data.covers[0] !== -1) {
              coverId = String(res.data.covers[0]);
            }
            return {
              id: id,
              title: res.data.title || 'Title unknown',
              cover_id: coverId
            };
          })
          .catch(err => {
            console.error(`Errore libro ${id}`, err);
            return { id: id, title: 'Errore caricamento', cover_id: null };
          })
      );

      const libriDettagliati = await Promise.all(richiestePromises);
      preferiti.value = libriDettagliati;

    } catch (error) {
      console.error("Errore nella risoluzione dei dettagli:", error);
    }
  });
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      username.value = user.displayName || "Name";
      iconaProfilo.value = user.photoURL || "icona1";
      ascoltaPreferitiUtente(user.uid);
    } else {
      username.value = "Ospite";
      preferiti.value = [];
      if (unsubscribePreferiti) unsubscribePreferiti();
    }
  });
});

onUnmounted(() => {
  if (unsubscribePreferiti) unsubscribePreferiti();
});
</script>

<template>
  <div class="min-vh-100 p-3 bg-panna">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-link p-0 border-0" aria-label="Torna indietro" @click="$router.back()">
         <i class="material-symbols-outlined cp text-dynamic" aria-hidden="true">arrow_back</i>
      </button>
    </div>

    <div class="card-custom rounded-5 p-4 text-center shadow-sm mb-4">
      <div class="mb-2">
        <img :src="getIconaUrl(iconaProfilo)" class="img-fluid rounded-circle shadow mb-4" style="width: 200px; height: 200px;" :alt="'Immagine profilo di ' + username">
      </div>
      <h3 class="text-dynamic">{{ username }}</h3>
      <div class="row mt-3 g-0">
        <div class="col" :aria-label="'Hai aggiunto ' + preferiti.length + ' libri ai tuoi preferiti'">
          <div class="h2 fw-bold m-0 text-dynamic">{{ preferiti.length }}</div>
          <small class="text-muted text-dynamic">Favorites</small>
        </div>
      </div>
    </div>

    <div class="card-custom rounded-5 p-4 shadow-sm mb-3">
      <h5 class="mb-3 text-capitalize text-dynamic"><span aria-hidden="true">❤️</span> Favorites</h5>
      <div class="row g-3">
        
        <div v-for="libro in preferiti" :key="libro.id" class="col-6 col-md-4">
          <router-link :to="{ path: '/descrizione/:id', query: { work: libro.id } }" class="text-decoration-none" :aria-label="'Apri descrizione del preferito: ' + libro.title">
            <div class="card card-item border-0 shadow-sm h-100 overflow-hidden rounded-4 card-hover" style="cursor: pointer;">
              <img v-if="libro.cover_id" :src="`https://covers.openlibrary.org/b/id/${libro.cover_id}-M.jpg`" class="card-img-top object-fit-cover" height="180" :alt="'Copertina di ' + libro.title">
              <div v-else aria-hidden="true" class="d-flex align-items-center justify-content-center text-muted border-bottom card-img-top p-2 text-center small text-wrap px-3" style="height: 180px; font-style: italic;">No picture available</div>
              <div class="p-2 small fw-bold text-truncate text-center text-dynamic">{{ libro.title }}</div>
            </div>
          </router-link>
        </div>

        <div class="col-6 col-md-4">
          <router-link to="/ricerca/:id" class="text-decoration-none h-100" aria-label="Aggiungi un nuovo libro ai tuoi preferiti">
            <div class="card-item border border-2 border-dashed rounded-4 d-flex align-items-center justify-content-center h-100 text-dynamic" style="min-height:216px">
              <i class="material-symbols-outlined fs-1" aria-hidden="true">add</i>
            </div>
          </router-link>
        </div>

      </div>
    </div>
  </div>
</template>
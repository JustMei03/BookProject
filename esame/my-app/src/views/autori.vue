<script setup>
import { useRoute } from 'vue-router';
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';

const route = useRoute();
const autore = ref(null);
const opere = ref([]);

// Impostiamo inizialmente a null invece del vecchio placeholder link
const fotoAutoreUrl = ref(null);

// Gestione Biografia (spesso è un oggetto o manca)
const biografia = computed(() => {
  if (!autore.value?.bio) return "Biografia non disponibile per questo autore.";
  return typeof autore.value.bio === 'string' ? autore.value.bio : autore.value.bio.value;
});

onMounted(async () => {
  try {
    const authorID = route.params.id; // Prende l'ID dall'URL (/autore/:id)
    
    // 1. Carica dati autore
    const res = await axios.get(`https://openlibrary.org/authors/${authorID}.json`);
    autore.value = res.data;

    // 2. Imposta foto autore (se esiste)
    if (autore.value.photos && autore.value.photos.length > 0) {
      fotoAutoreUrl.value = `https://covers.openlibrary.org/a/id/${autore.value.photos[0]}-L.jpg`;
    }

    // 3. Carica alcune opere famose dell'autore
    const worksRes = await axios.get(`https://openlibrary.org/authors/${authorID}/works.json?limit=8`);
    opere.value = worksRes.data.entries.map(work => ({
      key: work.key,
      title: work.title,
      cover_id: work.cover_id || (work.covers ? work.covers[0] : null)
    })).filter(work => work.title); // Mostriamo solo i lavori che hanno almeno un titolo

  } catch (err) {
    console.error("Errore caricamento autore:", err);
  }
});
</script>

<template>
<div v-if="autore" class="container mt-5">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <i class="material-symbols-outlined cp" @click="$router.back()">arrow_back</i>
  </div>
    <div class="row">
      
      <!-- FOTO AUTORE -->
      <div class="col-md-4 d-flex justify-content-center align-items-center flex-column">
        <!-- Se la foto dell'autore esiste -->
        <img 
          v-if="fotoAutoreUrl"
          :src="fotoAutoreUrl" 
          class="img-fluid rounded-circle shadow mb-4" 
          alt="Foto Autore"
          style="width: 250px; height: 250px; object-fit: cover;"
        >
        <!-- Se la foto dell'autore NON esiste -->
        <div 
          v-else 
          class="d-flex flex-column align-items-center justify-content-center bg-light text-muted border rounded-circle shadow mb-4 p-3 text-center" 
          style="width: 250px; height: 250px; font-style: italic; font-size: 0.9rem;"
        >
          <i class="material-symbols-outlined mb-2" style="font-size: 3rem;">person</i>
          <span>Foto non disponibile</span>
        </div>
      </div>

      <div class="col-md-8">
        <h1 class="display-4 fw-bold">{{ autore.name }}</h1>
        
        <div class="info-meta mb-4">
          <span v-if="autore.birth_date" class="badge bg-light text-dark border me-2">
            Nascita: {{ autore.birth_date }}
          </span>
          <span v-if="autore.death_date" class="badge bg-light text-dark border">
            Decesso: {{ autore.death_date }}
          </span>
        </div>

        <h3 class="h5 text-primary">Biografia</h3>
        <div class="bio-text">
          <p class="lead" style="text-align: justify;">
            {{ biografia }}
          </p>
        </div>
      </div>
    </div>

    <hr class="my-5">

    <!-- COPERTINE OPERE -->
    <section class="other-works mb-5">hub
      <h3 class="mb-4 text-center">Altre opere di {{ autore.name }}</h3>
      <div class="row">
        <div v-for="opera in opere" :key="opera.key" class="col-md-3 col-6 mb-4">
          <router-link :to="{ name: 'Descrizione', query: { work: opera.key.split('/').pop() } }" class="text-decoration-none">
            <div class="card h-100 border-0 shadow-sm card-hover">
              
              <!-- Se la copertina esiste -->
              <img
                v-if="opera.cover_id"
                :src="`https://covers.openlibrary.org/b/id/${opera.cover_id}-M.jpg`" 
                class="card-img-top" 
                style="height: 250px; object-fit: cover;"
                alt="Copertina libro"
              >
              
              <!-- Se la copertina NON esiste -->
              <div 
                v-else 
                class="d-flex align-items-center justify-content-center bg-light text-muted border-bottom card-img-top p-3 text-center small" 
                style="height: 250px; font-style: italic;"
              >
                Copertina non disponibile
              </div>

              <div class="card-body">
                <p class="card-text small fw-bold text-center mb-0">
                  {{ opera.title }}
                </p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="container mt-5 text-center">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Caricamento...</span>
    </div>
    <p class="mt-3">Caricamento profilo autore...</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';

const route = useRoute();
const autore = ref(null);
const opere = ref([]);
const mostraTuttaLaBio = ref(false);

const bioCorta = computed(() => biografia.value.slice(0, 200));

const fotoAutoreUrl = ref(null);

const biografia = computed(() => {
  if (!autore.value?.bio) return "Biography not available.";
  return typeof autore.value.bio === 'string' ? autore.value.bio : autore.value.bio.value;
});

onMounted(async () => {
  try {
    const authorID = route.params.id; 
    
    const res = await axios.get(`https://openlibrary.org/authors/${authorID}.json`);
    autore.value = res.data;

    if (autore.value.photos && autore.value.photos.length > 0) {
      fotoAutoreUrl.value = `https://covers.openlibrary.org/a/id/${autore.value.photos[0]}-L.jpg`;
    }

    const worksRes = await axios.get(`https://openlibrary.org/authors/${authorID}/works.json?limit=8`);
    opere.value = worksRes.data.entries.map(work => ({
      key: work.key,
      title: work.title,
      cover_id: work.cover_id || (work.covers ? work.covers[0] : null)
    })).filter(work => work.title);

  } catch (err) {
    console.error("Loading error", err);
  }
});
</script>

<template>
<div v-if="autore" class="container mt-5">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <button class="btn btn-link p-0 border-0" aria-label="Torna indietro" @click="$router.back()">
      <i class="material-symbols-outlined cp text-dynamic" aria-hidden="true">arrow_back</i>
    </button>
  </div>
    <div class="row">
      
      <div class="col-md-4 d-flex justify-content-center align-items-center flex-column">
        <img 
          v-if="fotoAutoreUrl"
          :src="fotoAutoreUrl" 
          class="img-fluid rounded-circle shadow mb-4" 
          alt="Foto Autore"
          style="width: 250px; height: 250px; object-fit: cover;"
        >
        <div 
          v-else
          aria-hidden="true" 
          class="d-flex flex-column align-items-center justify-content-center text-muted border rounded-circle shadow mb-4 p-3 text-center" 
          style="width: 250px; height: 250px; font-style: italic; font-size: 0.9rem;"
        >
          <i class="material-symbols-outlined mb-2" style="font-size: 3rem;">person</i>
          <span>No photo available</span>
        </div>
      </div>

      <div class="col-md-8">
        <h1 class="display-4 fw-bold">{{ autore.name }}</h1>
        
        <div class="info-meta mb-4">
          <span v-if="autore.birth_date" class="badge border me-2">
            Birth: {{ autore.birth_date }}
          </span>
          <span v-if="autore.death_date" class="badge border">
            Death: {{ autore.death_date }}
          </span>
        </div>

        <p class="lead" style="color: inherit;">
          {{ mostraTuttaLaBio ? biografia : bioCorta }}
          <button 
            v-if="biografia !== 'Biography not available.' && biografia.length > 200" 
            @click="mostraTuttaLaBio = !mostraTuttaLaBio" 
            class="btn btn-link p-0 ms-1"
            >
            {{ mostraTuttaLaBio ? 'Read less' : 'Read more' }}
          </button>
        </p>
      </div>
    </div>

    <hr class="my-5">

    <section class="other-works mb-5">
      <h3 class="mb-4 text-center">Other works by {{ autore.name }}</h3>
      <div class="row">
        <div v-for="opera in opere" :key="opera.key" class="col-md-3 col-6 mb-4">
          <router-link :to="{ name: 'Descrizione', query: { work: opera.key.split('/').pop() } }" class="text-decoration-none">
            <div class="card h-100 border-0 shadow-sm card-hover">
              <img
                v-if="opera.cover_id"
                :src="`https://covers.openlibrary.org/b/id/${opera.cover_id}-M.jpg`" 
                class="card-img-top" 
                style="height: 250px; object-fit: cover;"
                alt="Copertina libro"
              >
              <div 
                v-else 
                class="d-flex align-items-center justify-content-center text-muted border-bottom card-img-top p-3 text-center small" 
                style="height: 250px; font-style: italic;"
              >
                No picture available
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
    <div class="spinner-border" role="status">
    </div>
    <p class="mt-3">Loading author profile...</p>
  </div>
</template>
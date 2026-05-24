<script setup>
import { useRoute } from 'vue-router';
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

const route = useRoute();

// Variabili reattive
const libro = ref(null);
const autoreID = ref('');
const nomeAutore = ref('');
const copertinaUrl = ref('');
const libriSuggeriti = ref([]);
const mostraTuttaLaTrama = ref(false);
const tramaCompleta = ref("Caricamento descrizione...");
const generi = ref('');
const isPreferito = ref(false); // Stato del cuore

const tramaCorta = computed(() => tramaCompleta.value.slice(0, 200));

// FUNZIONE PREFERITI AGGIORNATA E FUNZIONANTE
const togglePreferito = () => {
  isPreferito.value = !isPreferito.value;
  
  let preferiti = JSON.parse(localStorage.getItem('libriPreferiti')) || [];
  const currentWorkID = route.query.work;

  if (isPreferito.value) {
    let coverIdEstratto = null;
    if (libro.value && libro.value.covers && libro.value.covers.length > 0 && libro.value.covers[0] !== -1) {
      coverIdEstratto = String(libro.value.covers[0]);
    }

    const libroDaSalvare = {
      id: currentWorkID,
      title: libro.value ? libro.value.title : 'Titolo sconosciuto',
      cover_id: coverIdEstratto
    };

    if (!preferiti.some(l => l.id === currentWorkID)) {
      preferiti.push(libroDaSalvare);
    }
  } else {
    preferiti = preferiti.filter(l => l.id !== currentWorkID);
  }

  localStorage.setItem('libriPreferiti', JSON.stringify(preferiti));
};

const caricaLibro = async () => {
  const workID = route.query.work;
  if (!workID) return;

  libro.value = null; 
  try {
    const res = await axios.get(`https://openlibrary.org/works/${workID}.json`);
    libro.value = res.data;
    
    // 1. Gestione trama
    tramaCompleta.value = typeof libro.value.description === 'string' 
      ? libro.value.description 
      : libro.value.description?.value || "Descrizione non disponibile.";

    // 2. Copertina
    if (libro.value.covers && libro.value.covers.length > 0 && libro.value.covers[0] !== -1) {
      copertinaUrl.value = `https://covers.openlibrary.org/b/id/${libro.value.covers[0]}-L.jpg`;
    } else {
      copertinaUrl.value = "Copertina non disponibile";
    }

    // 3. Gestione Generi
    const generiAmmessi = ['literature', 'biography', 'fantasy', 'action', 'romance', 'mystery', 'thriller', 'horror', 'sci-fi', 'lgbt'];
    if (libro.value.subjects?.length > 0) {
      const subjectsAPI = libro.value.subjects.map(s => s.toLowerCase());
      const generiFiltrati = generiAmmessi.filter(genere => subjectsAPI.some(subject => subject.includes(genere)));
      generi.value = generiFiltrati.length > 0 ? generiFiltrati.slice(0, 2).join(', ') : 'Genere non specificato';
    } else {
      generi.value = 'Genere non specificato';
    }

    // 4. Recupero Autore
    if (libro.value.authors && libro.value.authors.length > 0) {
      const authorKey = libro.value.authors[0].author.key;
      autoreID.value = authorKey.split('/').pop();

      const authorRes = await axios.get(`https://openlibrary.org${authorKey}.json`);
      nomeAutore.value = authorRes.data.name;
    }

    // 5. Chiamate in parallelo per suggeriti
    const richieste = [];
    if (autoreID.value) {
      richieste.push(axios.get(`https://openlibrary.org/authors/${autoreID.value}/works.json?limit=10`));
    }

    const primoGenere = libro.value.subjects?.[0];
    if (primoGenere) {
      const genereQuery = primoGenere.toLowerCase().replace(/ /g, '_');
      richieste.push(axios.get(`https://openlibrary.org/subjects/${genereQuery}.json?limit=10`));
    }

    if (richieste.length > 0) {
      const risposte = await Promise.all(richieste);
      const opereAutore = risposte[0] ? (risposte[0].data.entries || []) : [];
      const opereGenere = risposte[1] ? (risposte[1].data.works || []) : [];

      const tuttiIniziali = [
        ...opereAutore.map(w => ({ ...w, fonte: 'autore' })),
        ...opereGenere.map(w => ({ ...w, fonte: 'genere' }))
      ];

      const visti = new Set();
      
      libriSuggeriti.value = tuttiIniziali
        .filter(work => {
          const idOpera = work.key.split('/').pop();
          const nonEIlLibroCorrente = idOpera !== workID;
          const haCopertina = (work.covers && work.covers.length > 0) || work.cover_id;
          const giaVisto = visti.has(idOpera);

          if (nonEIlLibroCorrente && haCopertina && !giaVisto) {
            visti.add(idOpera);
            return true;
          }
          return false;
        })
        .map(work => ({
          key: work.key,
          title: work.title,
          cover_id: work.cover_id || (work.covers ? work.covers[0] : null)
        }))
        .slice(0, 4);
    }

    // CONTROLLO STATO INIZIALE PREFERITI (Messo in sicurezza)
    const preferitiEsistenti = JSON.parse(localStorage.getItem('libriPreferiti')) || [];
    isPreferito.value = preferitiEsistenti.some(l => l.id === workID);
    
  } catch (err) {
    console.error("Errore nel caricamento:", err);
  }
};

watch(() => route.query.work, () => {
  caricaLibro();
});

onMounted(caricaLibro);
</script>

<template>
  <div v-if="libro" class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <i class="material-symbols-outlined cp" @click="$router.back()">arrow_back</i>
  </div>
    <div class="row">
      <div class="col-md-4 mb-3">
        <img v-if="copertinaUrl.startsWith('http')" 
             :src="copertinaUrl" 
             class="img-fluid rounded shadow" 
             alt="Copertina">

        <div v-else class="bg-secondary-subtle text-muted rounded shadow d-flex align-items-center justify-content-center p-4 text-center fw-bold text-uppercase" style="aspect-ratio: 2/3; font-size: 0.9rem;">
          {{ copertinaUrl }}
        </div>
      </div>
      
      <div class="col-md-8">
        <h1 class="display-4">{{ libro.title }}</h1>
        <h4 class="text-secondary">
          di <router-link :to="'/autore/' + autoreID" class="author-link">{{ nomeAutore }}</router-link>
        </h4>
        <span class="badge bg-info text-dark mb-3">{{ generi }}</span>
        
        <p class="lead">
          {{ mostraTuttaLaTrama ? tramaCompleta : tramaCorta }}
          <button 
            v-if="tramaCompleta !== 'Descrizione non disponibile.' && tramaCompleta.length > 200" 
            @click="mostraTuttaLaTrama = !mostraTuttaLaTrama" 
            class="btn btn-link p-0 ms-1"
          >
            {{ mostraTuttaLaTrama ? 'Leggi meno' : 'Leggi tutto' }}
          </button>
        </p>

        <div class="d-flex gap-3 mt-4 align-items-center">
          <button @click="togglePreferito" 
            class="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
            :aria-label="isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'">
            <i class="bi fs-4" :class="isPreferito ? 'bi-heart-fill' : 'bi-heart'"></i>
            <span>{{ isPreferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti' }}</span>
          </button>
        </div>
      </div>
    </div>

    <hr class="separator" />

    <div class="row mt-3">
      <h3 class="mb-4">Ti potrebbe interessare</h3>
      <div v-for="suggerito in libriSuggeriti" :key="suggerito.key" class="col-6 col-md-3 mb-4">
        <router-link :to="{ name: 'Descrizione', query: { work: suggerito.key.split('/').pop() }}" class="text-decoration-none text-dark">
          <div class="card h-100 shadow-sm">
            <img :src="`https://covers.openlibrary.org/b/id/${suggerito.cover_id}-M.jpg`" class="card-img-top" alt="Cover">
            <div class="card-body text-center">
              <p class="card-text small fw-bold">{{ suggerito.title }}</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
  
  <div v-else class="container mt-5 text-center">Caricamento libro...</div>
</template>

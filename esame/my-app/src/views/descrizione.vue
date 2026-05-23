<script setup>
import { useRoute } from 'vue-router';
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { db, auth } from '../firestore.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const route = useRoute();

const libro = ref(null);
const autoreID = ref('');
const nomeAutore = ref('');
const copertinaUrl = ref('');
const libriSuggeriti = ref([]);
const mostraTuttaLaTrama = ref(false);
const tramaCompleta = ref("Loading description...");
const generi = ref('');
const isPreferito = ref(false); 
const currentUser = ref(null);
const isPending = ref(false); 
const tramaCorta = computed(() => tramaCompleta.value.slice(0, 200));

const verificaPreferitoIniziale = async () => {
  const currentWorkID = route.query.work;
  if (currentUser.value && currentWorkID) {
    const preferitoRef = doc(db, 'users', currentUser.value.uid, 'preferiti', currentWorkID);
    try {
      const docSnap = await getDoc(preferitoRef);
      isPreferito.value = docSnap.exists();
    } catch (error) {
      console.error("Error with the favorites status:", error);
    }
  } else {
    isPreferito.value = false;
  }
};

const togglePreferito = async () => {
  if (!currentUser.value) {
    alert("You must log in to save your favorites!");
    return;
  }

  const currentWorkID = route.query.work;
  if (!currentWorkID || isPending.value) return;

  isPending.value = true;
  const preferitoRef = doc(db, 'users', currentUser.value.uid, 'preferiti', currentWorkID);
  isPreferito.value = !isPreferito.value;

  try {
    if (isPreferito.value) {
      await setDoc(preferitoRef, { id: currentWorkID });
    } else {
      await deleteDoc(preferitoRef);
    }
  } catch (error) {
    console.error("Error while updating the database:", error);
    isPreferito.value = !isPreferito.value; 
  } finally {
    isPending.value = false;
  }
};

const caricaLibro = async () => {
  const workID = route.query.work;
  if (!workID) return;

  libro.value = null; 
  libriSuggeriti.value = [];
  try {
    const res = await axios.get(`https://openlibrary.org/works/${workID}.json`);
    libro.value = res.data;
    
    tramaCompleta.value = typeof libro.value.description === 'string' 
      ? libro.value.description 
      : libro.value.description?.value || "Description not available.";

    if (libro.value.covers && libro.value.covers.length > 0 && libro.value.covers[0] > 0) {
      copertinaUrl.value = `https://covers.openlibrary.org/b/id/${libro.value.covers[0]}-L.jpg`;
    } else {
      copertinaUrl.value = "No picture available";
    }

    const generiAmmessi = ['literature', 'biography', 'fantasy', 'action', 'romance', 'mystery', 'thriller', 'horror', 'sci-fi', 'lgbt'];
    if (libro.value.subjects?.length > 0) {
      const subjectsAPI = libro.value.subjects.map(s => s.toLowerCase());
      const generiFiltrati = generiAmmessi.filter(genere => subjectsAPI.some(subject => subject.includes(genere)));
      generi.value = generiFiltrati.length > 0 ? generiFiltrati.slice(0, 2).join(', ') : 'Category not specified';
    } else {
      generi.value = 'Category not specified';
    }

    if (libro.value.authors && libro.value.authors.length > 0) {
      const authorKey = libro.value.authors[0].author.key;
      autoreID.value = authorKey.split('/').pop();

      const authorRes = await axios.get(`https://openlibrary.org${authorKey}.json`);
      nomeAutore.value = authorRes.data.name;
    }

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
      const risposte = await Promise.all(richieste.map(p => p.catch(() => null)));
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
          const giaVisto = visti.has(idOpera);

          if (nonEIlLibroCorrente && !giaVisto) { 
            visti.add(idOpera);
            return true;
          }
          return false;
        })
        .map(work => ({
          key: work.key,
          title: work.title,
          cover_id: work.cover_id || (work.covers && work.covers[0] > 0 ? work.covers[0] : null)
        }))
        .slice(0, 4);
    }

    await verificaPreferitoIniziale();
    
  } catch (err) {
    console.error("Loading error", err);
  }
};

watch(() => route.query.work, () => {
  mostraTuttaLaTrama.value = false;
  caricaLibro();
});

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;
    caricaLibro();
  });
});
</script>

<template>
  <div v-if="libro" class="container mt-3">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-link p-0 border-0" aria-label="Torna indietro" @click="$router.back()">
        <i class="material-symbols-outlined cp text-dynamic" aria-hidden="true">arrow_back</i>
      </button>
    </div>
    <div class="row">
      <div class="col-md-4 mb-3">
        <img v-if="copertinaUrl.startsWith('http') && copertinaUrl !== 'No picture available'" 
             :src="copertinaUrl" 
             class="img-fluid rounded shadow" 
             alt="Copertina del libro"
             @error="copertinaUrl = 'No picture available'">
        <div v-else aria-hidden="true" class="text-muted rounded shadow d-flex align-items-center justify-content-center p-4 text-center fw-bold text-uppercase" style="aspect-ratio: 2/3; font-size: 0.9rem;">
          {{ copertinaUrl }}
        </div>
      </div>
      
      <div class="col-md-8">
        <h1 class="display-4">{{ libro.title }}</h1>
        <h4>
          by <router-link :to="'/autore/' + autoreID" class="author-link" :aria-label="nomeAutore">{{ nomeAutore }}</router-link>
        </h4>
        <span class="badge custom-genre-badge mt-3 mb-3" :aria-label="'Generi associati al libro: ' + generi">{{ generi }}</span>
        
       <p class="lead" style="color: inherit;">
          {{ mostraTuttaLaTrama ? tramaCompleta : tramaCorta }}
          <button 
            v-if="tramaCompleta !== 'Description not available.' && tramaCompleta.length > 200" 
            @click="mostraTuttaLaTrama = !mostraTuttaLaTrama" 
            class="btn btn-link p-0 ms-1"
            :aria-expanded="mostraTuttaLaTrama"
            >
            {{ mostraTuttaLaTrama ? 'Read less' : 'Read more' }}
          </button>
        </p>

        <div class="d-flex gap-3 mt-4 align-items-center">
          <button @click="togglePreferito" 
            :disabled="isPending"
            class="btn btn-outline-danger btn-preferiti w-100 d-flex align-items-center justify-content-center gap-2 py-2"
            :aria-label="isPreferito ? 'Remove from favorites' : 'Add to favorites'">
            <i class="bi fs-4" :class="isPreferito ? 'bi-heart-fill' : 'bi-heart'"></i>
            <span>{{ isPreferito ? 'Remove from favorites' : 'Add to favorites' }}</span>
          </button>
        </div>
      </div>
    </div>

    <hr class="separator" />

    <div class="row mt-3" aria-label="Libri consigliati che potrebbero interessarti">
      <h3 class="mb-4">You might be interested in</h3>
      <div v-for="suggerito in libriSuggeriti" :key="suggerito.key" class="col-6 col-md-3 mb-4">
        <router-link :to="{ name: 'Descrizione', query: { work: suggerito.key.split('/').pop() }}" class="text-decoration-none">
          <div class="card h-100 shadow-sm">
            <img v-if="suggerito.cover_id" 
                 :src="`https://covers.openlibrary.org/b/id/${suggerito.cover_id}-M.jpg`" 
                 class="card-img-top" 
                 alt="Cover"
                 @error="$event.target.src = 'https://via.placeholder.com/150x225?text=No+Cover'">
            <div v-else class="text-muted d-flex align-items-center justify-content-center text-center p-3 small" style="aspect-ratio: 2/3;">
              No picture available
            </div>
            <div class="card-body text-center">
              <p class="card-text small fw-bold">{{ suggerito.title }}</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
  
  <div v-else class="container mt-5 text-center">Loading book...</div>
</template>
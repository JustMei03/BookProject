<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';

const route = useRoute();
const router = useRouter();
const q = ref('');
const books = ref([]);
const cats = ref([]);
const age = ref('all');
const loading = ref(false);
const page = ref(1);
const side = ref(false);
const more = ref(true);

const load = async (append = false) => {
  if (loading.value) return;
  loading.value = true; 
  if (!append) { 
    page.value = 1; 
    books.value = []; 
    more.value = true; 
  }
  try {
    let query = `${q.value || 'subject:fiction'} ${cats.value.map(c => `subject:${c}`).join(' ')}`;
    if (age.value === 'kids') query += ' subject:children'; 
    else if (age.value === 'ya') query += ' subject:"young adult"';
    
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&page=${page.value}`);
    const data = await res.json();
    books.value = [...books.value, ...data.docs]; 
    more.value = data.docs.length === 12;
  } catch (error) {
    console.error("Loading error", error);
  } finally { 
    loading.value = false; 
  }
};

const go = (b) => {
  const id = b.key.split('/').pop();
  router.push({ path: '/descrizione/:id', query: { work: id } });
};

watch([cats, age], () => load(false), { deep: true });

onMounted(() => {
  load();
  window.onscroll = () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && more.value && !loading.value) {
      page.value++; 
      load(true);
    }
  };
});
</script>

<template>
  <div class="min-vh-100 bg-panna">
    
    <nav class="navbar p-0 m-0" role="search">
      <div class="container-fluid d-flex align-items-center justify-content-between">
        <div class="d-flex justify-content-center flex-grow-1">
          <div style="max-width: 500px; width: 100%;">
            <div class="input-group shadow-sm rounded-pill px-3 py-1 border bg-light">
              <span class="input-group-text bg-transparent border-0 text-muted">
                <i class="material-symbols-outlined" aria-hidden="true">search</i>
              </span>
              <input 
                v-model="q" 
                @keyup.enter="load(false)" 
                class="form-control border-0 bg-transparent shadow-none" 
                placeholder="Search books, authors, ..."
                aria-label="Cerca libri per titolo o autore"
              >
              <button 
                @click="side = !side" 
                class="btn btn-transparent d-lg-none border-0 p-0 ms-2 d-flex align-items-center"
                aria-label="Apri i filtri di ricerca"
                aria-controls="filterSidebar"
                :aria-expanded="side"
              >
                <i class="material-symbols-outlined" aria-hidden="true">tune</i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="container-fluid mt-2" aria-label="Filtri attivi attualmente" v-if="cats.length">
      <div class="d-flex flex-wrap gap-2 justify-content-center">
        <span v-for="c in cats" :key="c" class="badge border p-2 rounded-pill shadow-sm">
          {{ c }} 
          <button 
            @click="cats = cats.filter(x => x !== c)" 
            class="btn-close ms-1" 
            style="font-size:0.5rem"
            :aria-label="'Rimuovi filtro ' + c"
          ></button>
        </span>
      </div>
    </div>

    <div class="container-fluid mt-3">
      <div class="row">
        
        <div v-if="side" class="overlay d-lg-none" @click="side = false" aria-hidden="true"></div>
         
        <aside id="filterSidebar" :class="['filter-sidebar col-lg-2', { 'active': side }]" aria-label="Filtri di ricerca">
          <div class="d-flex align-items-center justify-content-between mb-3 d-lg-none">
            <h5 class="m-0 fw-semibold fs-6">Filters</h5>
            <button @click="side = false" class="btn btn-light rounded-circle p-0 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;" aria-label="Chiudi filtri">
              <i class="material-symbols-outlined fs-6" aria-hidden="true">close</i>
            </button>
          </div>
          
          <div class="card border-0 shadow-sm p-3 mb-3 ms-4">
            <h6 class="text-muted small fw-bold text-uppercase mb-3">Categories</h6>
            <div class="overflow-auto px-2" style="max-height:400px">
              <div v-for="g in ['literature', 'biography', 'fantasy', 'action', 'romance','mystery','thriller','horror','sci-fi', 'LGBT']" :key="g" class="form-check mb-2">
                <input class="form-check-input" type="checkbox" :value="g" v-model="cats" :id="g">
                <label class="form-check-label small text-capitalize ps-1" :for="g">{{ g }}</label>
              </div>
            </div>
          </div>
          
          <div class="card border-0 shadow-sm p-3 ms-4">
            <label for="ageSelect" class="text-muted small fw-bold text-uppercase mb-3 d-block">Age</label>
            <select v-model="age" id="ageSelect" class="form-select form-select-sm mb-2 rounded-3">
              <option value="all">All ages</option>
              <option value="kids">Kids</option>
              <option value="ya">Young Adults</option>
            </select>
          </div>
        </aside>

        <main class="col-lg-9">

          <div v-if="loading && !books.length" class="text-center p-5" role="status" aria-live="polite">
            <div class="spinner-border"></div>
          </div>
          
          <div v-else-if="!loading && books.length === 0" class="text-center p-5 animate-fade-in" role="alert">
            <div class="mb-3">
              <i class="material-symbols-outlined text-muted" style="font-size: 4rem;" aria-hidden="true">search_off</i>
            </div>
            <h5 class="fw-bold text-dynamic-title mb-2">Ops, we don't have what you're looking for!</h5>
            <p class="text-muted small">Try to change the keyword or remove some filters.</p>
          </div>

          <div v-else class="row g-3">
            <div v-for="b in books" :key="b.key" class="col-sm-6 col-md-4">
              <button 
                class="card h-100 border-0 shadow-sm p-2 text-center w-100" 
                @click="go(b)" 
                style="cursor:pointer;"
                :aria-label="'Vedi scheda completa del libro ' + b.title + ' di ' + (b.author_name?.[0] || 'Autore sconosciuto')"
              >
                <img 
                  v-if="b.cover_i" 
                  :src="`https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`" 
                  class="card-img p-2 object-fit-contain" 
                  style="height:180px" 
                  :alt="'Copertina di ' + b.title"
                >
                <div 
                  v-else 
                  aria-hidden="true"
                  class="d-flex align-items-center justify-content-center text-muted border rounded p-3 m-2 small w-100" 
                  style="height:164px; font-style: italic;"
                >
                  No picture available
                </div>

                <div class="card-body p-1 w-100">
                  <h6 class="text-truncate m-0 small fw-bold">{{ b.title }}</h6>
                  <small class="text-muted d-block text-truncate">{{ b.author_name?.[0] }}</small>
                </div>
              </button>
            </div>
          </div>
        </main>

      </div>
    </div>
   
  </div>
</template>
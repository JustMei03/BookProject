<script setup>
import { db, auth } from '../firestore.js';
import { updateProfile, signOut, onAuthStateChanged } from "firebase/auth"; 
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { useRouter } from "vue-router"; 
import { ref, onMounted } from "vue"; 

const router = useRouter(); 
const saveMessage = ref(""); 
const isError = ref(false); 

const username = ref(""); 
const iconaSelezionata = ref("icona1"); 
const mostraOpzioni = ref(false); 
const themeMode = ref(localStorage.getItem('theme') || 'light');

const mostraPopupLogout = ref(false);

const listaIcone = ["icona1", "icona2", "icona3", "icona4", "icona5", "icona6"];

const getIconaUrl = (nomeIcona) => {
  return new URL(`../assets/${nomeIcona}.png`, import.meta.url).href;
};

const toggleTheme = async () => {
  themeMode.value = themeMode.value === 'light' ? 'dark' : 'light';
  if (themeMode.value === 'dark') {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  localStorage.setItem('theme', themeMode.value);

  const user = auth.currentUser;
  if (user) {
    try {
      await setDoc(doc(db, "utenti", user.uid), { theme: themeMode.value, updatedAt: new Date() }, { merge: true });
    } catch (e) { console.error("Errore tema:", e); }
  }
};

onMounted(() => {
  if (themeMode.value === 'dark') document.documentElement.classList.add('dark-mode');
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      username.value = user.displayName || "Nome Lettore";
      if (user.photoURL) iconaSelezionata.value = user.photoURL;
      try {
        const userDoc = await getDoc(doc(db, "utenti", user.uid));
        if (userDoc.exists() && userDoc.data().theme) {
          themeMode.value = userDoc.data().theme;
        }
      } catch (e) { console.error("Errore recupero tema:", e); }
    } else {
      router.push("/");
    }
  });
});

const selezionaIcona = (nomeIcona) => {
  iconaSelezionata.value = nomeIcona;
  mostraOpzioni.value = false; 
};

const updateAccount = async () => {
  saveMessage.value = "Saving..."; 
  isError.value = false;
  const user = auth.currentUser; 
  if (!user) return;
  try {
    await updateProfile(user, { displayName: username.value, photoURL: iconaSelezionata.value }); 
    await setDoc(doc(db, "utenti", user.uid), { username: username.value, photoURL: iconaSelezionata.value, theme: themeMode.value, updatedAt: new Date() }, { merge: true }); 
    saveMessage.value = "Changes saved! ✅"; 
    setTimeout(() => { saveMessage.value = ""; router.push("/lettore"); }, 1500);
  } catch (e) {
    isError.value = true; 
    saveMessage.value = "Errore: " + e.message; 
  }
};

const richiediLogout = () => {
  mostraPopupLogout.value = true;
};

const confermaLogout = async () => {
  mostraPopupLogout.value = false;
  await signOut(auth); 
  router.push("/"); 
};
</script>

<template>
  <div class="bg-panna-custom p-3 p-md-5">
    <div class="d-flex justify-content-between align-items-center mb-3 position-relative">
      <button class="btn btn-link p-0 border-0" aria-label="Torna indietro" @click="$router.back()">
        <i class="material-symbols-outlined cp text-dynamic" aria-hidden="true">arrow_back</i>
      </button>
      <h1 class="h4 fw-bold m-0 text-dynamic position-absolute start-50 translate-middle">Settings</h1>
      <button @click="richiediLogout" class="btn btn-outline-danger btn-sm rounded-pill px-3">Logout</button>
    </div>

    <div class="container mx-auto" style="max-width: 600px;">
      <div class="text-center mb-5">
        <button 
          @click="mostraOpzioni = true" 
          class="btn p-0 border-0 bg-transparent shadow-none avatar-main-wrapper cp d-block mx-auto"
          aria-label="Cambia la foto del profilo"
          aria-haspopup="dialog"
          :aria-expanded="mostraOpzioni"
        >
          <img :src="getIconaUrl(iconaSelezionata)" class="-100 h-100 rounded-circle object-fit-cover" alt="Avatar utente corrente">
          <div class="avatar-badge"> <i class="material-symbols-outlined" aria-hidden="true">photo_camera</i> </div>
        </button>
      </div>

      <div class="card-custom border-0 shadow-sm p-4 rounded-5 mb-4">
        <label for="usernameInput" class="form-label small fw-bold text-dynamic">Name</label>
        <input 
          v-model="username" 
          id="usernameInput"
          type="text" 
          class="form-control form-control-lg border-0 input-custom rounded-4" 
          placeholder="What's your name?"
        >
        <button @click="updateAccount" class="btn btn-dark w-100 mt-4 py-3 rounded-4 fw-bold fs-5 shadow">Save and continue</button>
        
        <p v-if="saveMessage" :class="isError ? 'text-danger' : 'text-success'" class="fw-bold text-center mt-3 fs-6" role="alert" aria-live="assertive">
          {{ saveMessage }}
        </p>
      </div>

      <div class="card-custom border-0 shadow-sm mb-4" style="border-radius: 1rem;">
        <div class="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 class="fw-bold mb-1 text-dynamic">Mode</h5>
            <p class="text-muted-custom small mb-0">Change the interface mode</p>
          </div>
          <button @click="toggleTheme" class="btn btn-sm btn-outline-dark text-dynamic" :aria-label="'Passa alla modalità ' + (themeMode === 'light' ? 'Scura' : 'Chiara')">
            {{ themeMode === 'light' ? 'Dark mode' : 'Light mode' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="mostraOpzioni" class="icon-modal-overlay" @click="mostraOpzioni = false">
      <div 
        class="icon-modal-content" 
        @click.stop 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modalTitle"
      >
        <h4 id="modalTitle" class="mb-4 fw-bold">Choose your Avatar</h4>
        <div class="row g-4 justify-content-center">
          <div v-for="(icona, index) in listaIcone" :key="icona" class="col-4 text-center">
            <button 
              @click="selezionaIcona(icona)" 
              class="btn p-0 border-0 icon-option-wrapper cp d-block w-100" 
              :class="{ 'active-icon': iconaSelezionata === icona }"
              :aria-label="'Seleziona Avatar ' + (index + 1)"
              :aria-pressed="iconaSelezionata === icona"
            >
              <img :src="getIconaUrl(icona)" class="img-fluid rounded-circle shadow mb-4"  alt="Icona">
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mostraPopupLogout" class="icon-modal-overlay" @click="mostraPopupLogout = false">
      <div 
        class="icon-modal-content logout-modal text-center shadow-lg" 
        @click.stop 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="logoutTitle"
      >
        <h4 id="logoutTitle" class="fw-bold mb-3 text-dynamic">Sign Out</h4>
        <p class="text-muted-custom mb-4 small">Are you sure you want to log out of your account?</p>
        
        <div class="d-flex gap-3 justify-content-center">
          <button @click="mostraPopupLogout = false" class="btn btn-light-custom rounded-pill px-4 py-2 text-dynamic border fw-semibold flex-grow-1">
            Cancel
          </button>
          <button @click="confermaLogout" class="btn btn-danger rounded-pill px-4 py-2 fw-semibold flex-grow-1">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
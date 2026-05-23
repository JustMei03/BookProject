//questo file è il cuore della configurazione di un progetto web basato su Vite
//e serve a spiegare a Vite come compilare il codice, quali plugin usare e come gestire i percorsi dei file

import { defineConfig } from 'vite' //importa la funzione principale di Vite che serve a definire la configurazione
import vue from '@vitejs/plugin-vue' //importa il plugin ufficiale per permettere a Vite di capire e compilare il file .vue

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()], //plugins permette l'aggiunta di una lista (array) estensioni che aggiungono funzionalità a Vue
})

<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { auth } from '../firestore.js';
import { signInWithEmailAndPassword } from "firebase/auth";

const router = useRouter();

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const successMessage = ref("");

const clearErrors = () => {
  emailError.value = "";
  passwordError.value = "";
  successMessage.value = "";
};

const login = async () => {
  clearErrors();
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    successMessage.value = "Welcome back " + (userCredential.user.displayName || userCredential.user.email) + "!";

    setTimeout(() => {
      router.push("/ricerca/:id");
    }, 1200);

  } catch (error) {
    if (error.code === 'auth/invalid-email') {
      emailError.value = "The email address is invalid.";
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      emailError.value = "Incorrect credentials. Please try again.";
      passwordError.value = "Please check your password.";
    } else if (error.code === 'auth/wrong-password') {
      passwordError.value = "The password is incorrect.";
    } else {
      emailError.value = "Server access error.";
    }
  }
};
</script>

<template>
<div class="login-container"> 
  <div class="row w-100 m-0 justify-content-center align-items-center vh-100">
    <div class="col-11 col-sm-8 col-md-6 col-lg-4">
      <div class="cardlogin border-0 shadow-lg p-4 p-md-5" style="border-radius: 1.5rem;" role="main">
          
        <div class="text-center mb-4">
          <h2 class="fw-bold">Welcome back!</h2>
          <p class="text-muted small">Ready to discover new books?</p>
        </div>

          <div class="mb-3">
            <label for="emailInput" class="form-label small fw-bold">Email</label>
            <input
              v-model="email"
              id="emailInput"
              type="email"
              :aria-invalid="emailError ? 'true' : 'false'"
              aria-describedby="emailErrorMsg"
              class="form-control form-control-lg border-2"
              placeholder="name@example.com"
              style="border-radius: 0.8rem;"
              @input="clearErrors"
            />
            <div v-if="emailError" id="emailErrorMsg" class="text-danger small mt-1 d-flex align-items-center" role="alert">
              <span class="me-1" aria-hidden="true">⚠️</span> {{ emailError }}
            </div>
          </div>

          <div class="mb-4">
            <label for="passwordInput" class="form-label small fw-bold">Password</label>
            <input
              v-model="password"
              id="passwordInput"
              type="password"
              :aria-invalid="passwordError ? 'true' : 'false'"
              aria-describedby="passwordErrorMsg"
              class="form-control form-control-lg border-2"
              placeholder="••••••"
              style="border-radius: 0.8rem;"
              @input="clearErrors"
            />
            <div v-if="passwordError" id="passwordErrorMsg" class="text-danger small mt-1 d-flex align-items-center" role="alert">
              <span class="me-1" aria-hidden="true">⚠️</span> {{ passwordError }}
            </div>
          </div>

          <button
            class="btn btn-primary btn-lg w-100 shadow-sm fw-bold py-2 mb-3"
            @click="login"
            style="border-radius: 0.8rem;"
          >
            Login
          </button>

          <div v-if="successMessage" class="alert alert-success py-2 small border-0 text-center" style="border-radius: 0.5rem;" role="alert">
            <span aria-hidden="true">✅</span> {{ successMessage }}
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style>
.login-container {
  background-color: #F5E5DC;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  margin: 0;
  z-index: 9999;
}

.login-container .cardlogin {
  background-color: #ffffff;
  border-radius: 1.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  max-width: 90%;
}

.login-container label,
.login-container h2,
.login-container p,
.login-container .form-control {
  color: #1A2238;
}

.login-container .form-control {
  background-color: #ffffff;
  border: 1px solid #d1d1c8;
}

.login-container .form-control::placeholder {
  color: #1A2238;
}

.login-container .btn-primary {
  background-color: #1A2238;
  border-color: #1A2238;
}
</style>
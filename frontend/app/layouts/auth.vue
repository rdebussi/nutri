<!-- Layout de autenticação — usado pelas páginas de login/register.
     É mais simples (sem navbar, sidebar, etc.).
     O definePageMeta({ layout: 'auth' }) nas páginas ativa este layout. -->

<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #f9fafb;
}
</style>

<template>
  <div class="landing">
    <div class="hero">
      <h1>Nutri</h1>
      <p>Sua dieta personalizada com inteligência artificial</p>
      <div class="cta-buttons">
        <NuxtLink to="/register" class="btn-primary">Começar Grátis</NuxtLink>
        <NuxtLink to="/login" class="btn-outline">Já tenho conta</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.hero {
  text-align: center;
  padding: 2rem;
}

.hero h1 {
  font-size: 3rem;
  color: #10b981;
  margin-bottom: 0.5rem;
}

.hero p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: #10b981;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}

.btn-primary:hover { background: #059669; }

.btn-outline {
  padding: 0.75rem 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
}

.btn-outline:hover { background: #f3f4f6; }
</style>

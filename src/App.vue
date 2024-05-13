<template>
  <app-progress v-if="isLoading" />
  <div v-else class="container">
    <app-header />
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/AppHeader.vue'

const isLoading = ref<boolean>(true)
const userStore = useUserStore()

onMounted(() => {
  onAuthStateChanged(getAuth(), (user) => {
    if (user) {
      userStore.userId = user.uid
    } else {
      userStore.userId = ''
    }
    isLoading.value = false
  })
})
</script>

<style scoped>
.container {
  max-width: 1280px;
  margin: auto;
  padding: 24px;
}
</style>

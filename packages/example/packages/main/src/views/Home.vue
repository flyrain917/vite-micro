<template>
  <div>
    <h2>this is Home.vue</h2>
    <RemoteButton />
  </div>
</template>

<script setup>
import { remoteImport } from 'vite-micro/client'
import { defineAsyncComponent } from 'vue'

const RemoteButton = defineAsyncComponent(() => remoteImport('loginRemote/Button'))
</script>

<style></style>

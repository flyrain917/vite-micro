<template>
  <div>
    <div>
      <p><router-link to="/home">Go to Home</router-link></p>
      <p><router-link to="/login">Go to Login</router-link></p>
      <p><router-link to="/user">Go to User</router-link></p>
    </div>
    <h2>this is Main module</h2>
    <router-view />
  </div>
</template>

<script setup>
import {defineEmits} from 'vue'
const emit = defineEmits('upload')
console.log('====defineEmits====', emit)


</script>

<style>

</style>
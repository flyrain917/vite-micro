<template>
  <div>
    <h2>this is User module</h2>
    <div class="sandbox">这是sandbox里面的颜色</div>
    <router-view />
  </div>
</template>

<script setup></script>

<style>
.sandbox {
  color: blue;
}
</style>

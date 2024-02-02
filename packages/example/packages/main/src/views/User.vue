import { RouterView } from 'vue-router';
<template>
  <div class="user">
    <div class="sandbox">这是sandbox外面的颜色</div>
    <div style="border: 1px solid #ddd"><RouterView /></div>
  </div>
</template>
<style>
.sandbox {
  color: red;
}
</style>

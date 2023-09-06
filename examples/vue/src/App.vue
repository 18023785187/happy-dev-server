<template>
  <div class="container">
    <div class="header">
      <el-button
        :type="activePath === nav.path ? 'primary' : ''"
        v-for="nav in navs"
        :key="nav.path"
        @click="to(nav.path)"
        >{{ nav.name }}</el-button
      >
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterView, useRouter, useRoute } from "vue-router";
import { ElButton } from "element-plus";

const route = useRoute();
const router = useRouter();

const activePath = ref<string>("/");

watch(
  () => route.path,
  () => {
    activePath.value = route.path;
  }
);

const navs = [
  {
    name: "首页",
    path: "/",
  },
  {
    name: "关于",
    path: "/about",
  },
];

function to(path: string): void {
  router.push(path);
}
</script>

<style scoped lang="scss">
.container {
  padding: 20px;

  .header {
    padding-bottom: 20px;
  }
}
</style>

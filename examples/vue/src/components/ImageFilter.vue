<template>
  <div class="image-fileter" v-loading="loading">
    <div class="buttons-load">
      <el-upload accept="image/*" :show-file-list="false" :before-upload="uploadImage">
        <el-button type="primary" round>upload image</el-button>
      </el-upload>
      <el-button type="success" round @click="downloadImage">download image</el-button>
    </div>
    <div class="container" ref="container"></div>
    <div class="slider">
      <div class="slider-block" v-for="option in sliderOptions" :key="option.name">
        <span class="name">{{ option.name }}</span>
        <el-slider
          size="small"
          v-model="option.value"
          :min="0"
          :max="5"
          @change="handleEffect"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import ImageFilterLib from "@qq1069532844/image-filter";
import type { KernelName } from "@qq1069532844/image-filter";
import { ElUpload, ElButton, ElSlider, vLoading } from "element-plus";
import type { UploadProps } from "element-plus";
import { fileToBase64 } from "../utils";

// 等待滤波器实例生成后才能进行后续操作
const loading = ref<boolean>(true);

interface SliderOptions {
  name: KernelName;
  value: number;
}
const sliderOptions = ref<SliderOptions[]>([]);

const container = ref<HTMLElement>();
let imageFilter: ImageFilter | undefined;

onMounted(() => {
  imageFilter = new ImageFilterLib(container.value!);
  console.log(imageFilter);

  imageFilter.setViewport(container.value!.clientWidth, container.value!.clientHeight);

  resetSlider();

  loading.value = false;
});

/**
 * 上传图片并加载
 */
const uploadImage: UploadProps["beforeUpload"] = async (rawFile) => {
  const base64 = await fileToBase64(rawFile);
  await imageFilter!.loadImage(base64);
  resetSlider();
  return false;
};

/**
 * 下载图片
 */
const downloadImage = () => {
  const canvas = imageFilter!.canvas;
  const base64 = canvas.toDataURL("image/png");
  const link: HTMLAnchorElement = document.createElement("a");
  link.href = base64;
  link.download = Math.random() + ".png";
  link.click();
};

/**
 * 每次滑块更新就触发图像滤波器处理图像
 */
const handleEffect = () => {
  const kernelNames: KernelName[] = [];
  for (const item of sliderOptions.value) {
    for (let i = 0; i < item.value; ++i) {
      kernelNames.push(item.name);
    }
  }
  imageFilter!.handleEffect(kernelNames);
};

function resetSlider(): void {
  const kernelNames = imageFilter!.getKernelNames();
  sliderOptions.value = kernelNames.map((name) => ({
    name,
    value: 0,
  }));
}
</script>

<style scoped lang="scss">
.image-fileter {
  .buttons-load {
    display: flex;
  }
  .container {
    border: 2px solid #409eff;
    margin: 20px 0;
    width: 400px;
    height: 250px;
  }
  .slider {
    .slider-block {
      display: flex;
      width: 400px;
      .name {
        flex: 0 0 150px;
      }
    }
  }
}
</style>

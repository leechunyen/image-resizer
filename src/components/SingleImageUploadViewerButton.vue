<template>
  <div class="image-upload">
    <label class="upload-label">
      <div v-if="!previewImage" class="upload-placeholder">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>Click to upload</span>
      </div>
      <img v-else :src="previewImage" alt="Preview Image" class="preview-image" />
    </label>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
export default {
  name: 'ImageUpload',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const previewImage = ref(props.modelValue);

    watch(
        () => props.modelValue,
        newValue => {
          previewImage.value = newValue;
        }
    );

    return {
      previewImage,
    };
  },
};
</script>

<style scoped>
.image-upload {
  position: relative;
  display: inline-block;
  width: 150px;
  height: 150px;
  border: 2px dashed #ccc;
  border-radius: 3px;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  text-align: center;
}

.upload-placeholder {
  font-size: 16px;
  color: #aaa;
}

.upload-placeholder i {
  font-size: 24px;
  margin-bottom: 8px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>

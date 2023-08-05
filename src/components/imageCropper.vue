<template>
  <div class="image-cropper">
    <div class="cropper-wrapper">
      <cropper
          :stencil-props="{
            movable: false,
          }"
          :stencil-size="stencilSize"
          image-restriction="stencil"
          :auto-zoom="true"
          v-if="img"
          :src="img"
          @change="cropperChange"
      />
    </div>
  </div>
</template>

<script>
import {Cropper} from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

export default {
  components: {
    Cropper,
  },
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    stencilSize: {
      type: Object,
      default: () => ({width: 500, height: 500}),
    },
    imageParam: {
      type: String,
      default: null,
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      img: null,
      croppedImage: null,
    };
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(value) {
        this.croppedImage = value;
      },
    },
    croppedImage(value) {
      this.$emit('update:modelValue', value);
    },
    // Watch for changes in the imageParam prop
    imageParam: {
      immediate: true,
      handler(value) {
        this.img = value; // Set the img data from the parameter
      },
    },
  },
  methods: {
    cropperChange({coordinates, canvas}) {
      this.croppedImage = canvas.toDataURL();
      this.$emit('change', {coordinates, canvas});
    },
  },
};
</script>

<style scoped>
.image-cropper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.cropper-wrapper {
  width: 100%;
  max-width: 600px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>

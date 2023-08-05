<template>
  <div class="image-resizer">
    <h1>Image Resizer</h1>

    <!-- Upload -->
    <div class="upload-section">
      <input id="img-upload" v-show="false" type="file" @change="handleFileChange">
      <uploadViewer onclick="document.getElementById('img-upload').click()" v-model="input.image" />
    </div>

    <!-- Select Action -->
    <div class="action-section">
      <el-checkbox-group v-model="mode" size="large">
        <el-checkbox-button @change="resetCrop" key="crop" label="crop">Crop</el-checkbox-button>
        <el-checkbox-button key="compress" label="compress">Compress</el-checkbox-button>
      </el-checkbox-group>
    </div>

    <!-- Crop -->
    <div v-if="mode.includes('crop')" class="crop-section">
      <div class="crop-options" v-if="!crop.cropping">
        <el-radio-group v-model="crop.mode" size="large">
          <el-radio-button key="square" label="square">Square</el-radio-button>
          <el-radio-button key="flexible" label="flexible">Flexible</el-radio-button>
        </el-radio-group>
        <el-button @click="startCrop">Start Cropping</el-button>
      </div>

      <div v-if="crop.cropping">
        <imageCropper v-model="crop.croppedImage" :imageParam="input.image" :stencilSize="crop.mode==='square'?{ width: 500, height: 500 }:null" />
        <el-button @click="resetCrop">Reset Crop</el-button>
      </div>
    </div>

    <!-- Compress -->
    <div v-if="mode.includes('compress')" class="compress-section">
      <div class="slider-quality">
        <span class="demonstration">Quality</span>
        <el-slider :min="1" :max="100" v-model="compress.quality" />
      </div>
      <div class="size-settings">
        <span class="demonstration">Max width or height</span>
        <el-checkbox v-model="compress.limitWnH" label="Set width or height" size="large" />
        <el-input-number v-if="compress.limitWnH" v-model="compress.maxWnH" :min="100" />
      </div>
      <div class="file-size-settings">
        <span class="demonstration">Max file size</span>
        <el-checkbox v-model="compress.limitFileSize" label="Set file size" size="large" />
        <div v-if="compress.limitFileSize">
          <el-input-number v-model="compress.maxFileSize" :min="1" />
          <el-select v-model="compress.maxFileSizeType" class="size-type" placeholder="Select" size="large">
            <el-option key="b" label="B" value="b" />
            <el-option key="kb" label="KB" value="kb" />
            <el-option key="mb" label="MB" value="mb" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Convert -->
    <div class="convert-section">
      <el-radio-group v-model="convert.outputFormat" size="large">
        <el-radio-button label="jpeg">JPEG</el-radio-button>
        <el-radio-button label="png">PNG</el-radio-button>
        <el-radio-button label="webp">WEBP</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Download -->
    <div class="download-section">
      <el-button @click="downloadImage">Download</el-button>
    </div>
  </div>
</template>

<script>
import imageCropper from "../components/imageCropper.vue";
import uploadViewer from "../components/SingleImageUploadViewerButton.vue";
import {ElMessageBox,ElLoading} from 'element-plus';
import {convertBase64UrlToBlob, fileToBlob} from '../util/function.js';
import {compressImage} from "../util/image_compress";

export default {
  components: {
    uploadViewer,
    imageCropper,
  },
  data() {
    return {
      input:
          {
            image: null,
            blob: null,
          },
      mode: [],
      crop:{
        mode: 'square',
        cropping: false,
        croppedImage: null,
      },
      compress: {
        quality:100,
        limitWnH: false,
        maxWnH: 0,
        limitFileSize: false,
        maxFileSize: 30,
        maxFileSizeType: 'kb',
      },
      convert: {
        outputFormat: null,
      },
    }
  },
  methods: {
    // file upload
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file) {
        this.input.image = URL.createObjectURL(file)
        fileToBlob(file).then((b)=>{this.input.blob = b})
        this.resetCrop()
      }
    },
    // end file upload
    // crop
    startCrop() {
      if (this.isImageUploaded()) {
        this.crop.cropping = true
      }
    },
    resetCrop() {
      this.crop.cropping = false
      this.crop.croppedImage = null
    },
    // end crop
    // compress
    compressImg() {
      if (this.isImageUploaded() && this.isCropped()) {

        if (this.convert.outputFormat === null) {
          ElMessageBox.alert('Please select a output format', {
            confirmButtonText: 'OK'
          })
        } else {
          let blob = null;
          if (this.isCropped() && this.crop.croppedImage !== null) {
            blob = convertBase64UrlToBlob(this.crop.croppedImage)
          } else {
            blob = this.input.blob
          }

          let size = false
          if (this.mode.includes('compress') && this.compress.limitFileSize) {
            let sizeType = 0
            switch (this.compress.maxFileSizeType) {
              case 'b':
                sizeType = 1
                break
              case 'kb':
                sizeType = 1024
                break
              case 'mb':
                sizeType = 1024*1024
                break
            }
            size = this.compress.maxFileSize*sizeType
          }

          let maxWnH = false
          if (this.mode.includes('compress') && this.compress.limitWnH) {
            maxWnH = this.compress.maxWnH
          }

          let quality = 1
          if (this.mode.includes('compress')) {
            quality = this.compress.quality/100
          }

          return compressImage(blob,maxWnH,size,quality,this.convert.outputFormat)
          .then(function (blob) {
            return blob
          })
          .catch(function (e) {
            ElMessageBox.alert(e, {
              confirmButtonText: 'OK'
            })
          })
        }
      }
    },
    // end compress
    // download
    async downloadImage() {

      if (this.isImageUploaded() && this.isCropped()) {

        const loading = ElLoading.service({
          lock: true,
          text: 'Loading',
          background: 'rgba(0, 0, 0, 0.7)',
        })

        // const blob = await this.convertImg()
        const blob = await this.compressImg()

        loading.close()

        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url;
        link.download = 'output.' + this.convert.outputFormat
        link.click()

        URL.revokeObjectURL(url)
      }
    },
    // end download






    isImageUploaded() {
      if (!this.input.image) {
        ElMessageBox.alert('Please select a image', {
          confirmButtonText: 'OK'
        })
        return false
      }
      return true
    },
    isCropped() {
      if (this.mode.includes('crop') && !this.crop.croppedImage) {
        ElMessageBox.alert('Please crop the image', {
          confirmButtonText: 'OK'
        })
        return false
      }
      return true
    },
  }
}
</script>

<style scoped>
.image-resizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.upload-section,
.action-section,
.crop-section,
.compress-section,
.convert-section,
.download-section {
  margin-bottom: 20px;
}

.crop-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slider-quality {
  display: flex;
  align-items: center;
}

.size-settings,
.file-size-settings {
  display: flex;
  align-items: center;
}

.size-type {
  margin-left: 10px;
}
</style>

<template>
  <div class="image-resizer">
    <h1>{{title}}</h1>

    <!-- Upload -->
    <div class="upload-section">
      <input id="img-upload" v-show="false" type="file" accept="image/*" @change="handleFileChange">
      <uploadViewer onclick="document.getElementById('img-upload').click()" v-model="input.image" />
    </div>

    <!-- Select Action -->
    <div class="action-section">
      <el-checkbox-group v-model="mode" @change="imageChanged" size="large">
        <el-checkbox-button @change="resetCrop" key="crop" label="crop">Crop</el-checkbox-button>
        <el-checkbox-button key="compress" label="compress">Compress</el-checkbox-button>
      </el-checkbox-group>
    </div>

    <!-- Crop -->
    <div v-if="mode.includes('crop')" class="crop-section">
      <div class="crop-title"><el-text>Crop</el-text></div>
      <div class="crop-options" v-if="!crop.cropping">
        <div class="crop-options-f">
          <el-radio-group v-model="crop.mode" size="large">
            <el-radio-button key="square" label="square">Square</el-radio-button>
            <el-radio-button key="flexible" label="flexible">Flexible</el-radio-button>
          </el-radio-group>
        </div>
        <div class="crop-options-s">
          <el-button @click="startCrop">Start Cropping</el-button>
        </div>
      </div>

      <div v-if="crop.cropping && !crop.done">
        <div class="cropping-area-f">
          <el-text>Crop mode: {{crop.mode}}</el-text>
          <div>
            <el-button @click="resetCrop">Reset Crop</el-button>
            <el-button @click="crop.done = true">Done</el-button>
          </div>
        </div>
        <imageCropper v-model="crop.croppedImage" :imageParam="input.image" :stencilSize="crop.mode==='square'?{ width: 500, height: 500 }:null" />
      </div>
      <div v-if="crop.done" class="crop-done-area">
        <div class="crop-done-area-f">
          <el-text>Crop result</el-text>
          <el-button @click="resetCrop">Reset Crop</el-button>
        </div>
       <div class="crop-done-area-s">
         <img class="cropped-image" alt="cropped image" :src="crop.croppedImage"/>
       </div>
      </div>
    </div>

    <!-- Compress -->
    <div v-if="mode.includes('compress')" class="compress-section">
      <div class="slider-quality">
        <span class="demonstration">Quality</span>
        <el-slider @change="imageChanged" :min="1" :max="100" v-model="compress.quality" />
      </div>
      <div class="size-settings">
        <el-checkbox @change="imageChanged" class="compress-area-wh-cb" v-model="compress.limitWnH" label="Set width or height" size="large" />
        <el-input-number @change="imageChanged" class="compress-area-wh-ip" v-if="compress.limitWnH" v-model="compress.maxWnH" :min="100" />
      </div>
      <div class="file-size-settings">
        <el-checkbox @change="imageChanged" class="compress-area-fs-cb" v-model="compress.limitFileSize" label="Set file size" size="large" />
        <div v-if="compress.limitFileSize">
          <el-input-number @change="imageChanged" v-model="compress.maxFileSize" :min="1" class="compress-area-fs-ip"/>
          <el-select @change="imageChanged" v-model="compress.maxFileSizeType" class="compress-area-fs-ty-ip" placeholder="Select" size="large">
            <el-option key="b" label="B" value="b" />
            <el-option key="kb" label="KB" value="kb" />
            <el-option key="mb" label="MB" value="mb" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Convert -->
    <div class="convert-section">
      <el-radio-group @change="imageChanged" v-model="convert.outputFormat" size="large">
        <el-radio-button label="jpeg">JPEG</el-radio-button>
        <el-radio-button label="png">PNG</el-radio-button>
        <el-radio-button label="webp">WEBP</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Download -->
    <div class="output-section">
      <el-button v-if="!output.imageGenerated" @click="generateImage">Build Image</el-button>
      <div v-if="output.imageGenerated">
        <el-button @click="previewImage">Preview</el-button>
        <el-button @click="downloadImage">Download</el-button>
      </div>

    </div>
  </div>

  <!--Preview-->
  <el-dialog
      v-model="output.preview.open"
      title="Preview"
      width="70%"
      top="5vh"
      @close="previewClose"
  >
    <div class="preview-area">
      <img class="preview-image" alt="preview image" :src="output.preview.url"/>
    </div>

  </el-dialog>

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
      title: import.meta.env.VITE_APP_PROJECT_TITLE,
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
        done: false,
      },
      compress: {
        quality:100,
        limitWnH: false,
        maxWnH: 300,
        limitFileSize: false,
        maxFileSize: 50,
        maxFileSizeType: 'kb',
      },
      convert: {
        outputFormat: null,
      },
      output: {
        imageGenerated: false,
        blob: null,
        preview: {
          open: false,
          url: null,
        },
      }
    }
  },
  methods: {
    // file upload
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.type.startsWith("image/")) {
          this.input.image = URL.createObjectURL(file)
          fileToBlob(file).then((b)=>{this.input.blob = b})
          this.imageChanged()
          this.resetCrop()
        } else {
          ElMessageBox.alert('Only image file allowed', {
            confirmButtonText: 'OK'
          })
        }
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
      this.crop.done = false
      this.imageChanged()
    },
    // end crop
    // compress
    compressImg() {
      if (this.isImageUploaded() && this.isCropped()) {

        if (this.convert.outputFormat !== null) {
          let blob = null;
          if (this.isCropped() && this.crop.done) {
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
    // generate image
    async generateImage() {
      if (this.isImageUploaded() && this.isCropped()) {
        if (this.convert.outputFormat === null) {
          await ElMessageBox.alert('Please select a output format', {
            confirmButtonText: 'OK'
          })
        } else {
          const loading = ElLoading.service({
            lock: true,
            text: 'Loading',
            background: 'rgba(0, 0, 0, 0.7)',
          })

          await this.compressImg()
          .then((blob)=>{

            this.output.blob = blob
            this.output.imageGenerated = true

            loading.close()
          })
          .catch((e)=>{

            ElMessageBox.alert(e, {
              confirmButtonText: 'OK'
            })

            loading.close()
          })

        }
      }
    },
    imageChanged() {
      this.output.blob = null
      this.output.imageGenerated = false
    },
    // end generate image
    // download
    async downloadImage() {

      if (this.output.imageGenerated) {

        if (this.output.blob) {
          const url = URL.createObjectURL(this.output.blob)

          const link = document.createElement('a')
          link.href = url;
          link.download = 'output.' + this.convert.outputFormat
          link.click()

          URL.revokeObjectURL(url)
        }
      }
    },
    // end download
    // preview
    previewImage() {
      this.output.preview.url = URL.createObjectURL(this.output.blob)
      this.output.preview.open = true
    },
    previewClose() {
      URL.revokeObjectURL(this.output.preview.url)
    },
    // ens preview





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
      if (this.mode.includes('crop') && !this.crop.done) {
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
.output-section {
  margin-bottom: 20px;
}

.crop-section, .compress-section {
  padding: 15px 15px;
  border: solid 1px #969696;
  width: 600px;
}

.crop-title {
  width: 100%;
  display: flex;
  justify-content: center;
}

.crop-options-f, .crop-options-s {
  display: flex;
  justify-content: center;
  padding: 5px 0;
}

.cropping-area-f {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 0 20px;
}

.crop-done-area-f {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.crop-done-area-s {
  width: 100%;
  display: flex;
  justify-content: center;
}

.cropped-image {
  width: 350px;
  height: 350px;
  object-fit: contain;
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

.compress-area-wh-cb, .compress-area-fs-cb {
  width: 160px;
}

.compress-area-fs-ty-ip {
  margin-left: 10px;
  width:80px;
}

.preview-area {
  width: 100%;
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  height: auto;
}
</style>

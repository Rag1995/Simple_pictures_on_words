<template>
  <div id="app">
    <b-navbar type="dark" variant="dark" class="px-4 font-weight-bold">
      <b-navbar-brand> 簡單圖片上字 </b-navbar-brand>

      <b-navbar-nav class="ml-auto">
        <b-nav-item
          href="https://github.com/Rag1995"
          target="_blank"
          link-classes="d-flex flex-row align-items-center"
        >
          <b-icon icon="github" variant="white" font-scale="1" class="mr-2" />
          <span>Rag1995</span>
        </b-nav-item>
      </b-navbar-nav>
    </b-navbar>

    <b-overlay :show="overlay" rounded="sm">
      <b-container class="home">
        <b-form id="form" class="row">
          <b-form-group label="上傳圖片" class="col-6">
            <b-form-file
              v-model="files"
              multiple
              accept="image/jpeg, image/png"
              placeholder="選擇或拖拉檔案到此"
              drop-placeholder="拖拉檔案到此"
              @input="inputFiles()"
            />
          </b-form-group>

          <b-form-group label="圖片文字" class="col-6">
            <b-input-group>
              <b-form-input v-model="text" placeholder="輸入文字" />

              <b-input-group-append>
                <b-button
                  :variant="valid ? 'secondary' : 'primary'"
                  :disabled="valid"
                  @click="handleImgEdit()"
                >
                  新增文字到圖片並下載
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </b-form>

        <b-table striped hover :items="items" :fields="fields">
          <template #cell(delete)="{ index }">
            <b-button variant="danger" @click="removeItem(index)">
              刪除
            </b-button>
          </template>

          <template #cell(src)="{ value }">
            <img :src="value" />
          </template>
        </b-table>
      </b-container>
    </b-overlay>
  </div>
</template>

<script>
import moment from "moment";
import exifr from "exifr/dist/full.esm.mjs";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default {
  data() {
    return {
      overlay: false,
      files: [],
      items: [],
      text: "",
    };
  },
  computed: {
    fields() {
      return [
        { key: "delete", label: "操作", sortable: false },
        { key: "src", label: "預覽圖片", sortable: false },
        { key: "name", label: "檔案名稱", sortable: true },
        { key: "lastModified", label: "最後修改時間", sortable: true },
        { key: "DateTimeOriginal", label: "拍照時間", sortable: true },
      ];
    },
    valid() {
      return !(this.files.length > 0 && this.text.length > 0);
    },
  },
  methods: {
    goToEvents(url) {
      console.log(url);
      // location.href = url;
    },
    removeItem(index) {
      this.items.splice(index, 1);
      this.files.splice(index, 1);
    },
    async inputFiles() {
      this.overlay = true;
      await this.handleInputFiles();
      this.overlay = false;
    },
    async handleInputFiles() {
      const fn = async (file) => {
        const { name, lastModified } = file;
        const src = URL.createObjectURL(file);
        let data = {
          name: name,
          src: src,
          lastModified: this._formatDatetime(lastModified),
        };
        const tags = ["DateTimeOriginal"];
        const output = await exifr.parse(file, tags);
        if (output) {
          const { DateTimeOriginal } = output;
          data = {
            ...data,
            DateTimeOriginal: this._formatDatetime(DateTimeOriginal),
          };
        }
        return data;
      };
      const actions = this.files.map(fn);
      await Promise.all(actions).then((result) => {
        this.items = result;
      });
    },
    async imgEdit() {
      this.overlay = true;
      await this.handleImgEdit();
      this.overlay = false;
    },
    async handleImgEdit() {
      const imgLoad = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => reject();
        });
      };
      const fn = (item) => {
        return new Promise((resolve, reject) => {
          const { name, src } = item;
          imgLoad(src)
            .then((img) => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              const { width, height } = img;
              canvas.width = width;
              canvas.height = height;

              ctx.drawImage(img, 0, 0);
              ctx.fillStyle = "#FF0000";
              ctx.font = "24px sans-serif";
              const textWidth = ctx.measureText(this.text).width;
              // const textHeight = parseInt(ctx.font.substring(0, 2));
              ctx.fillText(this.text, width - textWidth - 10, height - 10);

              const imgUrl = canvas.toDataURL();
              resolve({
                name: name,
                imgUrl: imgUrl,
              });
            })
            .catch(() => reject());
        });
      };
      const actions = this.items.map(fn);
      const zip = new JSZip();

      await Promise.all(actions).then((result) => {
        result.forEach((el) => {
          const { name, imgUrl } = el;
          // 向zip檔案中新增圖片，可以新增多個檔案或者圖片，此處以圖片為例
          // base64圖片需要去掉base64圖片標識
          zip.file(name, imgUrl.substring(imgUrl.indexOf(",") + 1), {
            base64: true,
          });
        });
      });
      zip.generateAsync({ type: "blob" }).then((content) => {
        // see FileSaver.js
        saveAs(content, "example.zip");
      });
    },
    _formatDatetime(datetime) {
      return moment(datetime).format("YYYY/MM/DD hh:mm:ss");
    },
  },
};
</script>

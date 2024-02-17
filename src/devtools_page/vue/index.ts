import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'normalize.css';
import './scss/custom-element-plus.scss';

const pinia = createPinia();
createApp(App).use(pinia).use(ElementPlus).mount('#app');

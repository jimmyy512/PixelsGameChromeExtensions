<template>
  <el-row id="BackstageSideBar">
    <el-col :span="6">
      <el-menu
        active-text-color="rgb(66, 185, 131)"
        background-color="#1a2b3c"
        class="el-menu-vertical-demo"
        :default-active="activeComponentIndex"
        text-color="#fff"
        @select="handleSelect"
      >
        <el-menu-item
          v-for="(item, index) in sideBarItem"
          :key="index"
          :index="index.toString()"
        >
          <el-icon> <component :is="item.icon"></component></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-col>
    <el-col :span="18" style="padding: 0px 10px" class="LayoutStyle">
      <template v-if="selectedComponent !== null">
        <component :is="selectedComponent"></component>
      </template>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Iphone, User, ChromeFilled } from '@element-plus/icons-vue';
import PhoneVerificationCode from './common/PhoneVerificationCode.vue';
import OpenFullBackStage from './common/OpenFullBackStage.vue';
import {
  getTokenFromStorage,
  removeDomainStorage,
  removeTokenFromStorage,
} from '@/pages/Backstage/BackstageStorage';
import { logout } from '@/services/backstageAPI';
import { useLoginStore } from '@/store';

const loginStore = useLoginStore();
const emit = defineEmits(['overload']);

const logoutClickHandler = () => {
  getTokenFromStorage(async (retrievedToken: string) => {
    if (retrievedToken) {
      await logout(retrievedToken).then(res => {
        if (res.Code === 200) {
          loginStore.setLoginStatus(false);
          removeTokenFromStorage();
          emit('overload');
        }
      });
    }
  });
};

const sideBarItem = [
  { label: '手機驗證碼', component: PhoneVerificationCode, icon: Iphone },
  {
    label: '打開完整後台',
    component: OpenFullBackStage,
    icon: ChromeFilled,
  },
  { label: '登出', component: null, callback: logoutClickHandler, icon: User },
];

const activeComponentIndex = ref('0');
const selectedComponent = ref(sideBarItem[0].component);

const handleSelect = (selectedIndex: string) => {
  const it = sideBarItem[parseInt(selectedIndex)];
  if (it.component !== null) {
    selectedComponent.value = sideBarItem[parseInt(selectedIndex)].component;
  } else {
    it.callback?.();
  }
};
</script>

<style lang="scss" scoped>
#BackstageSideBar {
  height: 100%;
  // 決定兒子 Layout
  .LayoutStyle {
    overflow: auto;
    height: 100%;
    margin-bottom: 50px;
  }
}
</style>

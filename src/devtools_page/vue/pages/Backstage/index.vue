<template>
  <div id="BackstageIndex">
    <div v-if="!loginStore.isBackstageLogin">
      <div class="environment-select">
        <div v-for="env in environments" :key="env.value">
          <input
            type="radio"
            :value="env.value"
            v-model="selectedEnv"
            :id="env.value"
            name="environment"
            @change="handleEnvChange"
          />
          <label :for="env.value">{{ env.label }}</label>
        </div>
      </div>
      <div class="select-container">
        <div class="text">選擇帳號：</div>
        <select v-model="selectedAccount" @change="onAccountChange">
          <option
            v-for="account in dynamicAccounts"
            :key="account.username"
            :value="account"
          >
            {{ account.alias }}
          </option>
        </select>
      </div>
      <div v-if="manualEntry" class="manual-entry">
        <div class="input-wrapper">
          <label>帳號:</label>
          <input placeholder="Username" v-model="manualUsername" />
        </div>
        <div class="input-wrapper">
          <label>密碼:</label>
          <input
            placeholder="Password"
            type="password"
            v-model="manualPassword"
          />
        </div>
      </div>
      <div class="verification_code">
        <input v-model="verificationCode" />
        <img
          :src="verificationImage"
          alt="點擊刷新"
          @click="actionRefreshImage(true)"
        />
      </div>
      <button @click="login" :disabled="isLoggingIn" style="cursor: pointer">
        登入
      </button>
    </div>
    <div v-else style="height: 100%">
      <BackstageSideBar @overload="actionRefreshImage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import BackstageSideBar from './BackstageSideBar.vue';
import {
  fetchImageValidCode,
  getLoginItem,
  tokenValidity,
} from '@/services/backstageAPI';
import {
  saveTokenToStorage,
  getTokenFromStorage,
  saveDomainStorage,
  getDomainStorage,
} from './BackstageStorage';
import { ElMessage } from 'element-plus';
import { useAppStore, useLoginStore } from '@/store';
import {
  selectedEnv,
  environments,
  devAccounts,
  cqaAccounts,
  prodAccounts,
} from './environment';

let checkInterval: NodeJS.Timeout;
let countNum = 0;
const verificationCode = ref('');
const verificationImage = ref('');
const keyCode = ref('');
const token = ref('');
const isLoggingIn = ref(false);
const manualEntry = ref(true);
const manualUsername = ref('');
const manualPassword = ref('');
const manualAccountOption = { username: '', password: '', alias: '手動輸入' };
const selectedAccount = ref(manualAccountOption);

const loginStore = useLoginStore();
const appStore = useAppStore();

const countDownInterval = setInterval(() => {
  if (loginStore.isBackstageLogin) {
    return;
  }
  countNum++;
  if (countNum > 14) {
    actionRefreshImage(true);
  }
}, 1000);

const actionRefreshImage = (isShowMSG: boolean = false) => {
  countNum = 0;
  refreshImage(isShowMSG);
};

const dynamicAccounts = computed(() => {
  switch (selectedEnv.value) {
    case 'dev':
      return [manualAccountOption, ...devAccounts];
    case 'cqa':
      return [manualAccountOption, ...cqaAccounts];
    case 'prod':
      return [manualAccountOption, ...prodAccounts];
    default:
      return [manualAccountOption];
  }
});

function handleEnvChange() {
  const env = environments.find(e => e.value === selectedEnv.value);
  if (env && env.domain) {
    appStore.setDomain(env.domain);
    saveDomainStorage(env.domain);
  } else {
    appStore.setDomain('');
    verificationImage.value = '';
  }

  selectedAccount.value = manualAccountOption;
  manualEntry.value = true;

  actionRefreshImage();
}

async function checkTokenValidity(token: string): Promise<boolean> {
  try {
    const res = await tokenValidity(token);
    const isValid = res.Code === 200;
    loginStore.setLoginStatus(isValid);
    return isValid;
  } catch (error) {
    console.error('Error checking token validity:', error);
    loginStore.setLoginStatus(false);
    return false;
  }
}

async function refreshImage(isShowMSG: boolean) {
  try {
    const res = await fetchImageValidCode();
    verificationImage.value = `data:image/jpeg;base64,${res.Data.Item}`;
    keyCode.value = res.Data.KeyCode;
    verificationCode.value = '';
    manualUsername.value = '';
    manualPassword.value = '';

    if (isShowMSG) {
      ElMessage({
        message: '驗證碼已刷新.',
        type: 'warning',
      });
    }
  } catch (error) {
    console.error('Error fetching image verification code:', error);
  }
}

async function login() {
  const username = manualEntry.value
    ? manualUsername.value
    : selectedAccount.value.username;
  const password = manualEntry.value
    ? manualPassword.value
    : selectedAccount.value.password;

  try {
    const res = await getLoginItem(
      username,
      password,
      verificationCode.value,
      keyCode.value
    );
    token.value = res.Data.Token;
    saveTokenToStorage(token.value);
    loginStore.setLoginStatus(true);
  } catch (error) {
    console.error('Error during login:', error);
    ElMessage({
      message: '登入失敗',
      type: 'error',
    });
    loginStore.setLoginStatus(false);
  }
}

function onAccountChange() {
  manualEntry.value = selectedAccount.value.alias === '手動輸入';
}

onMounted(async () => {
  console.warn('backstage mounted!!!');

  // 取得暫存 Domain
  // getDomainStorage(async (domain: string) => {
  //   appStore.setDomain(domain);
  // });

  // 取得暫存Token
  getTokenFromStorage(async (retrievedToken: string) => {
    if (retrievedToken) {
      const isValid = await checkTokenValidity(retrievedToken);
      if (isValid) {
        checkInterval = setInterval(async () => {
          const isValid = await checkTokenValidity(token.value);
          if (!isValid && checkInterval) {
            clearInterval(checkInterval);
          }
        }, 10 * 60 * 1000);
      } else {
        handleEnvChange();
      }
    } else {
      handleEnvChange();
    }
  });
});

onUnmounted(() => {
  console.warn('backstage unmounted');
  clearInterval(checkInterval);
  clearInterval(countDownInterval);
});
</script>

<style scoped lang="scss">
#BackstageIndex {
  width: 100%;
  height: 100%;
  .verification_code {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    input {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: #2d3c4f;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: #eee;
      height: 47px;
      caret-color: #fff;

      &:focus {
        outline: none;
      }
    }

    img {
      margin: 5px 10px 0px;
      background: white;
      width: 100px;
      height: 42px;
      line-height: 42px;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  button {
    margin-top: 10px;
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 4px;
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;

    &:disabled {
      background-color: #aaa;
      border-color: #aaa;
      cursor: not-allowed;
    }
  }
}

.environment-select {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  margin-top: 10px;
  font-size: 18px;
  label {
    color: #409eff;
    cursor: pointer;
    margin-right: 8px;
  }

  input[type='radio'] {
    margin-right: 5px;
  }
}

.select-container {
  display: flex;
  position: relative;
  margin: 10px 0px 10px 0px;
  .text {
    color: #409eff;
    display: flex;
    align-items: center;
    width: 16%;
    font-size: 16px;
  }

  select {
    width: 200px;
    padding: 10px 12px;
    background-color: #2d3c4f;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #eee;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    position: relative;

    &:focus {
      outline: none;
      border-color: #409eff;
    }

    option {
      background-color: #2d3c4f;
      color: #eee;
    }
  }
}

.manual-entry {
  margin-top: 20px;
  width: 100%;
  .input-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    width: 100%;

    label {
      color: #409eff;
      font-size: 16px;
      width: 16%;
    }

    input {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: #2d3c4f;
      -webkit-appearance: none;
      border-radius: 4px;
      padding: 12px 5px 12px 15px;
      color: #eee;
      height: 40px;
      caret-color: #fff;
      width: 200px;

      &:focus {
        outline: none;
      }
    }
  }
}
</style>

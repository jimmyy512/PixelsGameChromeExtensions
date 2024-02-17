<template>
  <div>
    <el-row>
      <el-button type="primary" @click="initPhoneVerificationCode"
        >點擊刷新</el-button
      >
    </el-row>
    <el-row>
      <table class="data-table" v-if="phoneVerificationCode.length > 0">
        <thead>
          <tr>
            <th>創建時間</th>
            <th>手機號碼</th>
            <th>遊戲帳號</th>
            <th>所屬產品</th>
            <th>驗證碼</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in phoneVerificationCode" :key="item.Id">
            <td>{{ formatDate(item.CreateTime) }}</td>
            <td>{{ item.PhoneNum }}</td>
            <td>{{ item.LoginAccount }}</td>
            <td>{{ item.PackageName }}</td>
            <td>{{ item.VerifyCode }}</td>
          </tr>
        </tbody>
      </table>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue';
import { getTokenFromStorage } from '../BackstageStorage';
import { fetchPhoneVerifyCodes } from '@/services/backstageAPI';

let phoneVerificationCode: any = ref([]);

const initPhoneVerificationCode = () => {
  getTokenFromStorage(async (retrievedToken: string) => {
    if (retrievedToken) {
      await fetchPhoneVerifyCodes(retrievedToken).then(res => {
        phoneVerificationCode.value = res.Data.Items;
      });
    }
  });
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000); // 轉換秒為毫秒
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

onMounted(initPhoneVerificationCode);
</script>

<style scoped lang="scss">
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #2b2f3a;
  color: #eee;

  th,
  td {
    border: 1px solid #404454;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background-color: #343a46;
    font-weight: bold;
  }

  tr:nth-child(odd) {
    background-color: #323540;
  }

  tr:hover {
    background-color: #292c34;
  }
}
</style>

<template>
  <div id="Note">
    <template v-for="(it, index) in NoteDataList" :key="index">
      <el-input
        v-model="it.textarea"
        :rows="20"
        type="textarea"
        placeholder="輸入筆記..."
        @blur="saveData()"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onMounted, initCustomFormatter } from 'vue';
import SaveStorage from '@/utils/SaveStorage';
interface NoteData {
  textarea: string;
}

let NoteDataList: Ref<NoteData[]> = ref([]);

const createNoteData = () => {
  let tmp: NoteData = {
    textarea: '',
  };
  return [tmp];
};

const saveData = () => {
  SaveStorage.saveLocalStorage(
    SaveStorage.LocalStorageKey.NoteList,
    JSON.stringify(NoteDataList.value)
  );
};

onMounted(() => {
  SaveStorage.loadLocalStorage(SaveStorage.LocalStorageKey.NoteList).then(
    (result: any) => {
      console.warn('result:', result);
      if (result) {
        NoteDataList.value = JSON.parse(result);
      } else {
        NoteDataList.value = createNoteData();
      }
    }
  );
});
</script>

<style scoped lang="scss">
#Note {
  font-size: 16px;
  .el-row {
    margin-bottom: 20px;
    // border-bottom: 1px solid rgba(245, 245, 245, 0.373);
    padding-bottom: 10px;
    .RowTitle {
      font-size: 18px;
      font-weight: bold;
    }
  }
  .info {
    color: orange;
  }
}
</style>

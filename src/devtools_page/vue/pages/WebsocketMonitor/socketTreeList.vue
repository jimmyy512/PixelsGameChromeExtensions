<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import { inspectWindowEval } from '@/utils/utils';
import { SocketMessageMonitorMessageRender } from '@/types';
import { WINDOW_GLOBAL } from '@/conf';
import { SocketSelectData } from '@/types';
import { useSocketHook } from './SocketHook';

interface Tree {
  label: string;
  children?: Tree[];
}

let socketSelectData = ref<Array<SocketSelectData>>([]);

const props = withDefaults(
  defineProps<{
    selectRowData: SocketMessageMonitorMessageRender | null;
  }>(),
  {
    selectRowData: null,
  }
);

watch(
  () => props.selectRowData,
  async () => {
    if (props.selectRowData === null) {
      return;
    }
    let selectResult = await useSocketHook().selectEventRow(
      props.selectRowData
    );

    socketSelectData.value = selectResult;
  }
);

const handleNodeClick = (data: Tree) => {
  console.log('handleNodeClick', data);
};

const renderNodeContent = (node: any) => {
  return node.label.split(' ').map((part: any, index: any) => ({
    text: part,
    color:
      index === 0
        ? 'rgb(206, 163, 249)'
        : index === 1
        ? 'rgb(153, 127, 255)'
        : 'green',
  }));
};

const defaultProps = {
  children: 'children',
  label: 'label',
};
</script>

<template>
  <div id="socketTreeList">
    <el-tree
      :data="socketSelectData"
      :props="defaultProps"
      :default-expand-all="true"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="normalColor">{{ data.functionName }}</span>
        &nbsp;
        <span style="color: white"> : </span>
        &nbsp;
        <span class="valueColor">{{ data.functionResult }}</span>
        <!-- <div>{{ data }}</div> -->
        <!-- <span
          v-for="(item, key) in renderNodeContent(node)"
          :key="key"
          :style="{ color: item.color }"
        >
          {{ item.text }}
        </span> -->
      </template>
    </el-tree>
  </div>
</template>

<style lang="scss">
#socketTreeList {
  .normalColor {
    color: rgb(206, 163, 249);
  }
  .valueColor {
    color: rgb(153, 127, 255);
  }
  .el-tree {
    background: none !important;
  }
  .el-tree-node__label {
    color: rgba(206, 163, 249, 1) !important;
  }
  .el-tree-node__expand-icon {
    color: gray !important;
    font-size: 25px !important;
  }
  // 關閉hover顏色
  .el-tree-node:focus > .el-tree-node__content {
    background-color: transparent !important;
  }
  // 關閉hover顏色
  .el-tree-node,
  .el-tree-node__content {
    &:hover,
    &:focus {
      background-color: transparent !important;
    }
  }
}
</style>

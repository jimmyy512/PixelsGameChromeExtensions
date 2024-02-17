import { ref } from 'vue';

export const selectedEnv = ref('cqa');

export const environments = [
  { label: 'Dev', value: 'dev', domain: 'https://cloud.ljbdev.site' },
  { label: 'CQA', value: 'cqa', domain: 'https://cloud.ljbcqa.site' },
  { label: 'Prod', value: 'prod', domain: 'https://qa-cloud.cloud-hub.co' },
];

export const devAccounts = [
  {
    username: 'coinadmin',
    password: 'coinadmin',
    alias: '最高權限(Coinadmin)',
  },
];

export const cqaAccounts = [
  { username: 'andy654321', password: 'andy123456', alias: '最高權限(Andy)' },
  { username: 'kbslouid_mm22', password: '123456', alias: '亞星CQA' },
];

export const prodAccounts = [
  {
    username: 'grey123',
    password: '123456',
    alias: '正式服ＱＡ渠道號C20679_251',
  },
];

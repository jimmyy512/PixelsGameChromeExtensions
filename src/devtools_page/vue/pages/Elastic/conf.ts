import { ref } from "vue";

export const devUrl = 'https://kibana-dev-cqa.ljbrsrc.site/s/cloud-dev/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(message),filters:!(),index:dev-cloud-app-monitor,interval:auto,query:(language:kuery,query:Login_Success),sort:!(!(time,desc)))'
const cqaUrl = 'https://kibana-dev-cqa.ljbrsrc.site/s/cloud-cqa/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(message),filters:!(),index:cqa-cloud-app-monitor,interval:auto,query:(language:kuery,query:Login_Success),sort:!(!(time,desc)))'
const prodUrl = 'https://kibana-prod.ljbrsrc.site/s/cloud-prod/app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(message),filters:!(),index:prod-cloud-app-monitor,interval:auto,query:(language:kuery,query:Login_Success),sort:!(!(time,desc)))'

export const selectedEnv = ref('dev');

export const environments = [
    { label: 'Dev', value: 'dev', domain: devUrl },
    { label: 'CQA', value: 'cqa', domain: cqaUrl },
    { label: 'Prod', value: 'prod', domain: prodUrl }
];


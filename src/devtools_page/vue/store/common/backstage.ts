import { defineStore } from "pinia";

export const useAppStore = defineStore({
    id: 'appStore',

    state: () => ({
        domain: 'yourDefaultDomainHere', // 你的預設domain
    }),

    actions: {
        setDomain(newDomain: string) {
            this.domain = newDomain;
        },
    },
});

export const useLoginStore = defineStore({
    id: 'loginStore',

    state: () => ({
        isBackstageLogin: false,
    }),

    actions: {
        setLoginStatus(status: boolean) {
            this.isBackstageLogin = status;
        },
    },
});
import { defineStore } from "pinia";

export const useAppStore = defineStore('appStore', {

    state: () => ({
        domain: 'yourDefaultDomainHere', // 你的預設domain
    }),

    actions: {
        setDomain(newDomain: string) {
            this.domain = newDomain;
        },
    },
});

export const useLoginStore = defineStore('loginStore', {

    state: () => ({
        isBackstageLogin: false,
    }),

    actions: {
        setLoginStatus(status: boolean) {
            this.isBackstageLogin = status;
        },
    },
});
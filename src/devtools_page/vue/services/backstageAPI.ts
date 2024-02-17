import api from '@/api';
import { useAppStore } from "@/store";

export const fetchImageValidCode = async () => {
    const domain = useAppStore().domain;
    try {
        const response = await api.get(`${domain}/cloud/system/user/imagevalidcode`);
        return response;
    } catch (error) {
        throw new Error('Network response was not ok.');
    }
};

export const getLoginItem = async ( username: string, password: string, validCode: string, keyCode: string) => {
    const domain = useAppStore().domain;
    try {
        const formData = new FormData();
        formData.append('Username', username);
        formData.append('Password', password);
        formData.append('ValidCode', validCode);
        formData.append('KeyCode', keyCode);
        formData.append('UseNewPermission', 'true');

        const response = await api.post(`${domain}/cloud/system/user/login`, formData);

        // Check for success (based on assumption that the API uses a Code property for status)
        if (response.Code !== 200) {
            throw new Error('Failed to login.');
        }

        return response;
    } catch (error) {
        console.error('Error during login:', error);
        throw new Error('Failed to login.');
    }
};



export const tokenValidity = async (token: string) => {
    const domain = useAppStore().domain;
    try {
        const headers = {
            Token: token,
        };
        const response = await api.get(`${domain}/cloud/system/user/islogin`,{},  { headers });
        return response;
    } catch (error) {
        console.error('Error checking token validity:', error);
        return false;
    }
};

export const logout = async ( token: string ) => {
    const domain = useAppStore().domain;
    try {
        const headers = {
            Token: token,
        };
        const response = await api.get(`${domain}/cloud/system/user/logout`,{},  { headers });
        return response;
    } catch (error) {
        console.error('Error checking token validity:', error);
        return false;
    }
}

export const fetchPhoneVerifyCodes = async ( token: string ) => {
    const domain = useAppStore().domain;
    try {
        const headers = {
            Token: token,
        };
        const response = await api.get(`${domain}/cloud/admin/phoneverifycode/list?Page=1&PageSize=20&LoginAccount=&PhoneNum=&PlayerId=&PackageId=`,{},  { headers });
        return response;
    } catch (error) {
        console.error('Error checking token validity:', error);
        return false;
    }
}

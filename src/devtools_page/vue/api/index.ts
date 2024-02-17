import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

class Api {
    private axiosInstance: AxiosInstance;
    private debounceTimers: Map<string, ReturnType<typeof setTimeout>>;

    constructor() {
        this.axiosInstance = axios.create({
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
        });

        this.debounceTimers = new Map();
    }

    debounce(id: string, fn: () => void, delay: number) {
        if (this.debounceTimers.has(id)) {
            clearTimeout(this.debounceTimers.get(id) as ReturnType<typeof setTimeout>);
        }

        const timer = setTimeout(() => {
            fn();
            this.debounceTimers.delete(id);
        }, delay);

        this.debounceTimers.set(id, timer);
    }

    async get<T = any>(url: string, params?: any, config?: AxiosRequestConfig, debounce?: number): Promise<T> {
        return this.makeRequest('get', url, params, config, debounce);
    }

    async post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}, debounce?: number): Promise<T> {
        if (data instanceof FormData) {
            config.headers = { ...(config.headers || {}), 'Content-Type': undefined };
        }
        return this.makeRequest('post', url, data, config, debounce);
    }


    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig, debounce?: number): Promise<T> {
        return this.makeRequest('put', url, data, config, debounce);
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig, debounce?: number): Promise<T> {
        return this.makeRequest('delete', url, undefined, config, debounce);
    }

    private async makeRequest<T = any>(
        method: 'get' | 'post' | 'put' | 'delete',
        url: string,
        dataOrParams?: any,
        config: AxiosRequestConfig = {},
        debounce?: number
    ): Promise<T> {
        const fn = async () => {
            let response: AxiosResponse<T>;

            switch (method) {
                case 'get':
                    response = await this.axiosInstance.get(url, { ...config, params: dataOrParams });
                    break;
                case 'post':
                    response = await this.axiosInstance.post(url, dataOrParams, config);
                    break;
                case 'put':
                    response = await this.axiosInstance.put(url, dataOrParams, config);
                    break;
                case 'delete':
                    response = await this.axiosInstance.delete(url, config);
                    break;
            }

            return response.data;
        }

        if (debounce) {
            return new Promise((resolve, reject) => {
                this.debounce(url, async () => {
                    try {
                        resolve(await fn());
                    } catch (error) {
                        reject(error);
                    }
                }, debounce);
            });
        } else {
            return await fn();
        }
    }
}

const api = new Api();

export default api;

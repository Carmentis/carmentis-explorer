import { ServiceStatus, useServiceStatusStore } from "@/stores/serviceStatus";

let baseUrl = "";

export function setApiBaseUrl(url: string) {
    baseUrl = url.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
    return baseUrl;
}

export const customFetch = async <T>(
    url: string,
    {
        method,
        params,
        body,
    }: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        params?: any;
        body?: any;
        responseType?: string;
    },
): Promise<T> => {
    let targetUrl = `${baseUrl}${url}`;

    if (params) {
        targetUrl += '?' + new URLSearchParams(params);
    }

    let response: Response;
    let data: any;

    try {
        response = await fetch(targetUrl, {
            method,
            body,
        });

        data = await response.json();
    } catch (e) {
        const serviceStatus = useServiceStatusStore();
        serviceStatus.setStatus(ServiceStatus.UNAVAILABLE);
        throw e;
    }

    if (response.status === 503) {
        const serviceStatus = useServiceStatusStore();
        const m = data.message.match(/the indexer is not synchronized \(height (\d+) \/ (\d+)\)/);
        if (m !== null) {
            const progress = parseInt(m[1], 10) / parseInt(m[2], 10) || 0;
            serviceStatus.setStatus(ServiceStatus.REINDEXING);
            serviceStatus.setReindexingProgress(progress);
        } else {
            serviceStatus.setStatus(ServiceStatus.UNAVAILABLE);
        }
    } else if (response.ok) {
        const serviceStatus = useServiceStatusStore();
        serviceStatus.setStatus(ServiceStatus.OK);
    }

    return {
        data,
        status: response.status,
        headers: response.headers,
    } as T;
};

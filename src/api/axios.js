import axios from "axios"

export const API_URL = import.meta.env.VITE_PUBLIC_API_URL || ""

/**
 * This is the main Axios instance.
 * Renamed to AXIOS_INSTANCE to be used by the customInstance function.
 */
export const AXIOS_INSTANCE = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
})

AXIOS_INSTANCE.interceptors.response.use(
    (response) => {
        // Return the data directly
        return response.data
    },
    (error) => {
        // Handle errors globally
        return Promise.reject(error)
    },
)

export default function customInstance(config, options) {
    const source = axios.CancelToken.source()
    return AXIOS_INSTANCE({
        ...config,
        ...options,
        cancelToken: source.token,
    })
}

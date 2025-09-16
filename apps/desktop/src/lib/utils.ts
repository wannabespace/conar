export const getApiUrl = () => localStorage.getItem('__API_URL_FOR_PRODUCTION_TEST_CASES__') ?? import.meta.env.VITE_PUBLIC_API_URL

// api.ts

import { BACKEND_URL } from './env';

// Use BACKEND_URL throughout your API calls

const fetchData = async () => {
    const response = await fetch(`${BACKEND_URL}/data`);
    const data = await response.json();
    return data;
};

export { fetchData };
const BACKEND_BASE_URL = 'https://complaints-registration-platform-full-tytv.onrender.com/api';

async function fetchAPI(endpoint, options = {}) {
    // Merge credentials option so cookies are sent with requests
    const config = {
        ...options,
        credentials: 'omit', // Wait, the instructions say backend sets cookie. But cross origin with localhost:3000 and file:// doesn't work well with cookies. Wait, if we use file:// cookies don't work. We might need a local server for frontend, but instructions say "allow requests from the frontend origin (the local port the frontend runs on)". 
        // Let's set credentials to 'include' and assume the user runs the frontend on a local server.
    };
    config.credentials = 'include';
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
        config.headers = {
            ...config.headers,
            'Content-Type': 'application/json'
        };
    }

    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

export const api = {
    auth: {
        sendOtp: (name, email) => fetchAPI('/auth/send-otp', { method: 'POST', body: { name, email } }),
        register: (email, otp, password) => fetchAPI('/auth/register', { method: 'POST', body: { email, otp, password } }),
        login: (email, password) => fetchAPI('/auth/login', { method: 'POST', body: { email, password } }),
        logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
        me: () => fetchAPI('/auth/me', { method: 'GET' })
    },
    complaints: {
        getAiQuestion: (complaint_text) => fetchAPI('/ai/question', { method: 'POST', body: { complaint_text } }),
        submit: (complaint_text, ai_question, user_answer) => fetchAPI('/complaints', { method: 'POST', body: { complaint_text, ai_question, user_answer } }),
        getMy: () => fetchAPI('/complaints/my', { method: 'GET' }),
        getAll: () => fetchAPI('/admin/complaints', { method: 'GET' })
    }
};

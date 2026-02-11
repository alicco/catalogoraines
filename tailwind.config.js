/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                darkBlue: '#0f213c',
                teal: '#2a8a88',
                lightBlueBg: '#e0f7fa',
                statusGreen: '#4caf50',
                statusYellow: '#ffc107',
                statusRed: '#f44336',
                kitCyan: '#26c6da',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 2px 5px rgba(0,0,0,0.1)',
            }
        },
    },
    plugins: [],
}

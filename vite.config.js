import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    // Pre-bundle recharts & deps agar tidak gagal di Vite dev mode
    optimizeDeps: {
        include: [
            'recharts',
            'recharts/es6/index',
            'react-is',
        ],
    },

});


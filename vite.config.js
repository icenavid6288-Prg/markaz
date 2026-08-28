import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import inertia from '@inertiajs/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        inertia(),
        tailwindcss(),
    ],
    server: {
        cors: true,
        origin: 'http://localhost:5173',
        watch: {
            ignored: ['**/.freebuff/**'],
        },
    },
});

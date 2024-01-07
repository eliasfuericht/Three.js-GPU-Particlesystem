import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [glsl()],
    server: {
        host: '0.0.0.0',
        port: 3000,
    },
});


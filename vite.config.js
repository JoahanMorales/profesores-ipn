import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    // Optimize output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Component chunks by feature
          'search-components': [
            './src/components/SearchPage.jsx',
            './src/components/SearchableSelect.jsx',
          ],
          'profile-components': [
            './src/components/ProfesorProfile.jsx',
            './src/components/EvaluationForm.jsx',
          ],
          'landing-components': [
            './src/components/LandingPage.jsx',
            './src/components/Footer.jsx',
          ],
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Source maps only for debugging (disable in production)
    sourcemap: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
  
  // Performance hints
  server: {
    warmup: {
      clientFiles: [
        './src/components/SearchPage.jsx',
        './src/components/LoginPage.jsx',
        './src/components/LandingPage.jsx',
      ],
    },
  },
})

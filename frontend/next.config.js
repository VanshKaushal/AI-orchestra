/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Static export does not support rewrites. 
  // API calls now use the direct URL: http://127.0.0.1:8000
};

module.exports = nextConfig;

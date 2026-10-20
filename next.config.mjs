/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          /DumpStack\.log\.tmp/i,
          /hiberfil\.sys/i,
          /pagefile\.sys/i,
          /swapfile\.sys/i,
          /^[a-zA-Z]:[\\/](DumpStack\.log\.tmp|hiberfil\.sys|pagefile\.sys|swapfile\.sys)/i,
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

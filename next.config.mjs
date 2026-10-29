/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored:
          /[\\/](?:node_modules|\.git|\.next)|[a-zA-Z]:[\\/](?:DumpStack\.log\.tmp|hiberfil\.sys|pagefile\.sys|swapfile\.sys)|(?:DumpStack\.log\.tmp|hiberfil\.sys|pagefile\.sys|swapfile\.sys)/i,
      };
    }
    return config;
  },
};

export default nextConfig;

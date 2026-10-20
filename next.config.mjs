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
          "**/DumpStack.log.tmp",
          "**/pagefile.sys",
          "**/swapfile.sys",
          "**/hiberfil.sys",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

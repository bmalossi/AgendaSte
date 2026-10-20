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
          "**/hiberfil.sys",
          "**/pagefile.sys",
          "**/swapfile.sys",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "../app" : ".next",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // config.target = ["web", "electron-renderer"];
    return config;
  },
  transpilePackages: [
    "@ant-design",
    "antd",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-tree",
    "rc-table",
  ],
};

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
    return config;
  },
  transpilePackages: [
    "@ant-design",
    "antd",
    "rc-input",
    "rc-pagination",
    "rc-picker",
    "rc-tree",
    "rc-table",
    "rc-util",
  ],
};

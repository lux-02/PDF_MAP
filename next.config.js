/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      {
        "pdfjs-dist/build/pdf": "pdfjs-dist/build/pdf",
      },
    ];
    return config;
  },
};

module.exports = nextConfig;

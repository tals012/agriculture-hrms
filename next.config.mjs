/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  // ✅ Moved out of `experimental`
  serverExternalPackages: ["pdf-lib", "@pdf-lib/fontkit", "dayjs"],

  // ❌ Removed deprecated `esmExternals` setting
  // experimental: {
  //   serverComponentsExternalPackages: ["pdf-lib", "@pdf-lib/fontkit", "dayjs"],
  //   esmExternals: "loose",
  // },

  images: {
    domains: [
      `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
    ],
  },

  productionBrowserSourceMaps: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

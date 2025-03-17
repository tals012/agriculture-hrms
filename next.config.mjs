/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-lib", "@pdf-lib/fontkit", "dayjs"],
    esmExternals: "loose",
  },
  images: {
    domains: [
      `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
    ],
  },
  productionBrowserSourceMaps: false, // Disable source maps in development
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  }
};

export default nextConfig;

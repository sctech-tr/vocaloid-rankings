/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.youtube.com',
          pathname: '/vi/**'
        },
        {
          protocol: 'https',
          hostname: 'static.vocadb.net'
        },
        {
          protocol: 'https',
          hostname: 'nicovideo.cdn.nimg.jp',
          pathname: '/thumbnails/**'
        },
        {
          protocol: 'http',
          hostname: 'i*.hdslb.com'
        },
      ],
    },
    webpack: (config) => {
      config.externals.push({
        sharp: "commonjs sharp"
      });
      config.module.rules.push(
        {
          test: /\.md$/,
          type: 'asset/source',
        }
      )
      config.externals.push('bun:sqlite');
  
      return config;
    },
    transpilePackages: ['@mui/x-charts'],
    experimental: {
      webpackMemoryOptimizations: true,
      turbo: {}
    }
  }

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/phase4/long_term_goals',
        destination: '/phase4/long-term-goals',
        permanent: true,
      },
      {
        source: '/phase4/short_term_goals',
        destination: '/phase4/short-term-goals',
        permanent: true,
      },
      {
        source: '/phase4/contingency_strategies',
        destination: '/phase4/contingency-strategies',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig; 
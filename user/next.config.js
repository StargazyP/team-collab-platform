/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  devIndicators: {
    buildActivity: false,
  },
  output: "standalone", // Docker 배포용
  // 개발 시 외부 도메인(jangdonggun.iptime.org 등) 및 로컬 네트워크 IP에서 접근 허용
  allowedDevOrigins: ["jangdonggun.iptime.org", "192.168.0.9"],
};

module.exports = nextConfig;


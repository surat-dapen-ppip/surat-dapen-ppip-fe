/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["pdfjs-dist"],
    },
    reactStrictMode: false,
};

export default nextConfig;

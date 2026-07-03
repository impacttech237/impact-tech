/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

try {
  const cloudflare = await import("@opennextjs/cloudflare");
  if (typeof cloudflare.initOpenNextCloudflareForDev === "function") {
    cloudflare.initOpenNextCloudflareForDev();
  }
} catch {
  // Optional dependency for Cloudflare deployments; ignore locally when not installed.
}

export default nextConfig;

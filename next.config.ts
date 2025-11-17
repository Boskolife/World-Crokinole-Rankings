import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";


const withNextIntl = createNextIntlPlugin("./src/app/localization/i18n.ts");

const nextConfig: NextConfig = {
  /* config options here */
  sassOptions: {
    additionalData: (content: string, loaderContext: { resourcePath?: string }) => {
      const resourcePath: string = String(loaderContext.resourcePath || "");
      const normalized = resourcePath.replace(/\\/g, "/");
      // Skip utility files to avoid order/cycle issues
      if (normalized.includes("/src/app/styles/scss-utils/")) return content;
      // If file already brings the utils, do nothing
      if (
        /@use\s+["'].*scss-utils\/index["']\s+as\s+\*;?/.test(content) ||
        /@import\s+["'].*scss-utils\/compat-legacy["'];?/.test(content)
      ) {
        return content;
      }
      return '@use "@/app/styles/scss-utils/index" as *;\n' + content;
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
};

export default withNextIntl(nextConfig);

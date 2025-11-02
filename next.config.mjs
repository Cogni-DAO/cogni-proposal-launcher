import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rainbow-me/rainbowkit'],
  outputFileTracingRoot: join(__dirname)
};

export default withVanillaExtract(nextConfig);
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',workers:1,webServer:{command:'PORT=5191 HOST=127.0.0.1 node scripts/dev-bridge.mjs',port:5191,reuseExistingServer:false},use:{channel:'chrome',baseURL:process.env.TEST_BASE_URL||'http://localhost:5188',viewport:{width:1400,height:920}},reporter:'list',outputDir:'artifacts/browser'});

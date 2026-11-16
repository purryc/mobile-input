import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'*.browser.ts',workers:1,use:{channel:'chrome',baseURL:'http://127.0.0.1:5199',viewport:{width:1280,height:960}},reporter:'list',outputDir:process.env.INPUT_CONTROLS_QA_DIR||'test-results',webServer:{command:'npm run dev',url:'http://127.0.0.1:5199',reuseExistingServer:true}});

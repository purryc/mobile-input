import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'*.browser.ts',workers:1,use:{channel:'chrome',headless:true,viewport:{width:1280,height:900}},reporter:'list',outputDir:'../../artifacts/design-system/browser'});

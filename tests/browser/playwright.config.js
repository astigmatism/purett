'use strict';

const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: ['smoke.spec.js', 'dialog-scale.spec.js', 'scale-interactions.spec.js'],
  timeout: 240000,
  expect: {timeout: 15000},
  fullyParallel: false,
  workers: 1,
  reporter: [['line']],
  use: {
    baseURL: process.env.PURETT_BASE_URL || 'http://127.0.0.1:8080',
    headless: true,
    viewport: {width: 1100, height: 820},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});

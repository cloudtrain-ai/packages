import { Config } from '@stencil/core';
import tailwind, { PluginConfigOpts, PluginOpts, type TailwindConfig, tailwindHMR } from 'stencil-tailwind-plugin';
import cfg from './tailwind.config';

const twConfigurationFn = (_: string, config: TailwindConfig): TailwindConfig => {
  return {
    ...config,
    ...cfg
  };
};

const opts = {
  ...PluginOpts.DEFAULT,
  tailwindConf: twConfigurationFn
} satisfies PluginConfigOpts;


export const config: Config = {
  namespace: 'cloudtrain-chatbot',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  plugins: [
    tailwind(opts),
    tailwindHMR(),
  ],
  devServer: {
    reloadStrategy: 'pageReload'
  },
  testing: {
    browserHeadless: "new",
  },
};

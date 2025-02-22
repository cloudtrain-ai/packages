import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
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
    reactOutputTarget({
      outDir: '../chatbot-react/lib/components/stencil-generated/',
      hydrateModule: '@cloudtrain/chatbot/hydrate',
    }),
    {
      type: 'dist-hydrate-script',
      dir: './hydrate',
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
    browserHeadless: "shell",
  },
};

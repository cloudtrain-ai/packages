import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import tailwind, { tailwindHMR, setPluginConfigurationDefaults } from 'stencil-tailwind-plugin';

setPluginConfigurationDefaults({
  enableDebug: false,
  tailwindCssPath: './src/styles/tailwind.css',
});

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
    tailwind(),
    tailwindHMR(),
  ],
  devServer: {
    reloadStrategy: 'pageReload'
  },
  testing: {
    browserHeadless: "shell",
  },
};

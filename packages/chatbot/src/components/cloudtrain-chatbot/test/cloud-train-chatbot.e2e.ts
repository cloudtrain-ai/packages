import { newE2EPage } from '@stencil/core/testing';

describe('cloudtrain-chatbot', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<cloudtrain-chatbot></cloudtrain-chatbot>');

    const element = await page.find('cloudtrain-chatbot');
    expect(element).toHaveClass('hydrated');
  });
});

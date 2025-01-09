import { newSpecPage } from '@stencil/core/testing';
import { CloudTrainChatbot } from '../cloudtrain-chatbot';

describe('cloudtrain-chatbot', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [CloudTrainChatbot],
      html: `<cloudtrain-chatbot></cloudtrain-chatbot>`,
    });
    expect(page.root).toEqualHtml(`
      <cloudtrain-chatbot>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </cloudtrain-chatbot>
    `);
  });
});

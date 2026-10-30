import nx from '@nx/eslint-plugin';
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'care',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'care',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // ADR-0002: màn hình phiếu yêu cầu chỉ phụ thuộc TicketPort.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@care/shared-data-access-api',
              importNames: ['TicketApi'],
              message:
                'Inject TicketPort (@care/portal-domain-tickets) thay vi goi TicketApi truc tiep (ADR-0002).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];

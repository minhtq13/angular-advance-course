import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          // Quy tắc phụ thuộc (buổi 1): app -> feature -> ui/data-access -> domain -> util; scope chỉ dùng chính nó + shared.
          // domain (port + mô hình nghiệp vụ) nằm dưới data-access: adapter phụ thuộc hợp đồng, không ngược lại.
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
              ],
              // Feature lấy dữ liệu qua port/API service, không tự dùng HttpClient.
              bannedExternalImports: ['@angular/common/http'],
            },
            {
              // Buổi 2: ui được dùng kiểu của domain (TypeScript thuần, không Angular) làm input.
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
              // Domain không biết Angular, HTTP hay UI: chỉ TypeScript thuần + rxjs.
              // (@angular/compiler vẫn được dùng trong test-setup.ts do generator sinh ra.)
              bannedExternalImports: [
                '@angular/core*',
                '@angular/common*',
                '@angular/router*',
                '@angular/forms*',
                'ng-zorro-antd*',
              ],
            },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
            {
              sourceTag: 'scope:portal',
              onlyDependOnLibsWithTags: ['scope:portal', 'scope:shared'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.html'],
    rules: {
      // ng-zorro gắn control trực tiếp lên <label> (<label nz-checkbox>, <label nz-radio-button>)
      // -> rule này báo lỗi sai với cách dùng chuẩn của thư viện.
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
];

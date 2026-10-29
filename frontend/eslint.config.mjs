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
          // Quy tac phu thuoc (buoi 1): app -> feature -> ui/data-access -> domain -> util; scope chi dung chinh no + shared.
          // domain (port + mo hinh nghiep vu) nam duoi data-access: adapter phu thuoc hop dong, khong nguoc lai.
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
              // Feature lay du lieu qua port/API service, khong tu dung HttpClient.
              bannedExternalImports: ['@angular/common/http'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
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
              // Domain khong biet Angular, HTTP hay UI: chi TypeScript thuan + rxjs.
              // (@angular/compiler van duoc dung trong test-setup.ts do generator sinh ra.)
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
      // ng-zorro gan control truc tiep len <label> (<label nz-checkbox>, <label nz-radio-button>)
      // -> rule nay bao loi sai voi cach dung chuan cua thu vien.
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
];

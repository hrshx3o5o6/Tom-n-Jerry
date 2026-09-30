'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseInstalls, checkPackage, inspect } = require('../core/jerry');
const { DEFAULTS } = require('../core/config');
const { makeProject, write } = require('./helpers');

const names = cmd => parseInstalls(cmd).map(i => `${i.eco}:${i.name}`);

test('parses package names across managers', () => {
  assert.deepEqual(names('npm install express-rate-limit'), ['node:express-rate-limit']);
  assert.deepEqual(names('npm i -D jest@29 @types/node@^20'), ['node:jest', 'node:@types/node']);
  assert.deepEqual(names('pnpm add zod && yarn add lodash'), ['node:zod', 'node:lodash']);
  assert.deepEqual(names('bun add hono'), ['node:hono']);
  assert.deepEqual(names('pip install requests==2.31 Django>=4'), ['python:requests', 'python:django']);
  assert.deepEqual(names('python3 -m pip install python_dateutil'), ['python:python-dateutil']);
  assert.deepEqual(names('uv pip install httpx'), ['python:httpx']);
  assert.deepEqual(names('uv add fastapi'), ['python:fastapi']);
  assert.deepEqual(names('cargo add serde@1'), ['rust:serde']);
  assert.deepEqual(names('go get github.com/gin-gonic/gin@v1.9.1'), ['go:github.com/gin-gonic/gin']);
  assert.deepEqual(names('bundle add rack'), ['ruby:rack']);
  assert.deepEqual(names('CI=1 sudo npm install left-pad'), ['node:left-pad']);
});

test('ignores restores, globals, requirement files and local paths', () => {
  assert.deepEqual(names('npm install'), []);
  assert.deepEqual(names('npm ci'), []);
  assert.deepEqual(names('npm i -g typescript'), []);
  assert.deepEqual(names('pip install -r requirements.txt'), []);
  assert.deepEqual(names('pip install -e .'), []);
  assert.deepEqual(names('npm install ./local-pkg file:../x'), []);
  assert.deepEqual(names('echo npm install express'), []);
  assert.deepEqual(names('npm test'), []);
});

test('finds direct node deps with line numbers', () => {
  const root = makeProject();
  const hit = checkPackage(root, root, { eco: 'node', name: 'express-rate-limit' });
  assert.equal(hit.direct, true);
  assert.match(hit.where, /^package\.json:\d+$/);
});

test('finds transitive node deps in the lockfile', () => {
  const root = makeProject();
  assert.deepEqual(checkPackage(root, root, { eco: 'node', name: 'debug' }), { direct: false, where: 'package-lock.json' });
  assert.equal(checkPackage(root, root, { eco: 'node', name: 'zod' }), null);
});

test('finds deps in a nested workspace package.json', () => {
  const root = makeProject({ files: { 'packages/api/package.json': { dependencies: { zod: '^3' } } } });
  const hit = checkPackage(root, `${root}/packages/api/src`, { eco: 'node', name: 'zod' });
  assert.equal(hit.direct, true);
  assert.match(hit.where, /packages\/api\/package\.json:\d+/);
});

test('finds python deps in requirements and pyproject', () => {
  const root = makeProject({ files: { 'requirements.txt': 'Django==4.2\ndjango-filter>=23\n' } });
  assert.equal(checkPackage(root, root, { eco: 'python', name: 'django-filter' }).where, 'requirements.txt:2');
  const root2 = makeProject({ files: { 'pyproject.toml': '[project]\ndependencies = [\n  "httpx>=0.27",\n]\n' } });
  assert.equal(checkPackage(root2, root2, { eco: 'python', name: 'httpx' }).where, 'pyproject.toml:3');
});

test('finds rust, go and ruby deps', () => {
  const root = makeProject({
    files: {
      'Cargo.toml': '[dependencies]\nserde = "1"\n',
      'go.mod': 'module x\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n)\n',
      Gemfile: "source 'https://rubygems.org'\ngem 'rack'\n",
    },
  });
  assert.equal(checkPackage(root, root, { eco: 'rust', name: 'serde' }).where, 'Cargo.toml:2');
  assert.equal(checkPackage(root, root, { eco: 'go', name: 'github.com/gin-gonic/gin' }).where, 'go.mod:4');
  assert.equal(checkPackage(root, root, { eco: 'ruby', name: 'rack' }).where, 'Gemfile:2');
});

test('inspect suggests native replacements for unneeded packages', () => {
  const root = makeProject();
  const [f] = inspect(root, root, 'npm install uuid', DEFAULTS);
  assert.equal(f.kind, 'native');
  assert.match(f.message, /randomUUID/);
  assert.deepEqual(inspect(root, root, 'npm install uuid', { ...DEFAULTS, jerry: { nativeReplacements: false } }), []);
});

test('inspect reports nothing for genuinely new packages', () => {
  const root = makeProject();
  write(root, 'README.md', 'hi');
  assert.deepEqual(inspect(root, root, 'npm install zod', DEFAULTS), []);
});

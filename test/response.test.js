import test from 'node:test';
import assert from 'node:assert';
import { makeProjectOverviewResponse, makeResponse } from '../index.js';

test('makeResponse returns content and structuredContent', () => {
  const text = 'hello';
  const data = { a: 1 };

  const result = makeResponse(text, data);

  assert.ok(result.content);
  assert.strictEqual(result.content[0].text, text);
  assert.deepStrictEqual(result.structuredContent, data);
});

test('structuredContent is present and object-like', () => {
    const result = makeResponse('test', { foo: 'bar' });

    assert.strictEqual(typeof result.structuredContent, 'object');
    assert.strictEqual(result.structuredContent.foo, 'bar');
});

test('makeProjectOverviewResponse returns structured content for a committee', () => {
  const result = makeProjectOverviewResponse({
    id: 'demo',
    committees: [{
      id: 'demo',
      name: 'Apache Demo',
      shortdesc: ' Demo project\nfor tests ',
      homepage: 'https://demo.apache.org/',
      chair: 'Jane Doe',
      group: 'demo',
    }],
    podlings: {},
    groups: {
      demo: ['alice', 'bob', 'carol'],
      'demo-pmc': ['alice', 'bob'],
    },
    repos: {
      demo: 'https://github.com/apache/demo',
      'demo-site': 'https://github.com/apache/demo-site',
      other: 'https://github.com/apache/other',
    },
    releases: {
      demo: {
        'demo-1.0.0': '2026-04-01',
        'demo-0.9.0': { date: '2026-03-01' },
      },
    },
  });

  assert.match(result.content[0].text, /^# Apache Demo/);
  assert.match(result.content[0].text, /## Repositories \(2\)/);
  assert.deepStrictEqual(result.structuredContent, {
    query: 'demo',
    found: true,
    id: 'demo',
    name: 'Apache Demo',
    type: 'committee',
    description: 'Demo project for tests',
    homepage: 'https://demo.apache.org/',
    chair: 'Jane Doe',
    pmcGroupName: 'demo-pmc',
    pmcMemberCount: 2,
    committerGroupName: 'demo',
    committerCount: 3,
    repositories: [
      { name: 'demo', url: 'https://github.com/apache/demo' },
      { name: 'demo-site', url: 'https://github.com/apache/demo-site' },
    ],
    recentReleases: [
      { name: 'demo-1.0.0', date: '2026-04-01' },
      { name: 'demo-0.9.0', date: '2026-03-01' },
    ],
  });
});

test('makeProjectOverviewResponse returns structured suggestions when not found', () => {
  const result = makeProjectOverviewResponse({
    id: 'dem',
    committees: [{
      id: 'demo',
      name: 'Apache Demo',
      group: 'demo',
    }],
    podlings: {
      demo_podling: { name: 'Demo Podling' },
    },
    groups: {},
    repos: {},
    releases: {},
  });

  assert.strictEqual(
    result.content[0].text,
    'Project "dem" not found. Similar project IDs: demo, demo_podling.'
  );
  assert.deepStrictEqual(result.structuredContent, {
    query: 'dem',
    found: false,
    suggestions: ['demo', 'demo_podling'],
  });
});

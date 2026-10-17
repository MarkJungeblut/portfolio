import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { CreateNodesContextV2 } from '@nx/devkit';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNodesV2 } from './index';

const [, createNodes] = createNodesV2;
const options = { buildTarget: 'app:build:development' };

describe('spec-test-target', () => {
  let workspaceRoot: string;
  let context: CreateNodesContextV2;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'spec-test-target-'));
    context = { workspaceRoot, nxJsonConfiguration: {} };
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  function addFile(path: string) {
    const fullPath = join(workspaceRoot, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, '');
  }

  async function targetsFor(projectRoot: string) {
    const configFile = `${projectRoot}/project.json`;
    addFile(configFile);
    const [[, result]] = await createNodes([configFile], options, context);
    return result.projects?.[projectRoot]?.targets;
  }

  it('adds a test target to a project with specs', async () => {
    addFile('libs/ui/src/lib/button/button.spec.ts');

    expect(await targetsFor('libs/ui')).toEqual({
      test: {
        executor: '@angular/build:unit-test',
        cache: true,
        inputs: ['default', '^production'],
        options: {
          buildTarget: 'app:build:development',
          tsConfig: '{projectRoot}/tsconfig.spec.json',
          watch: false,
        },
      },
    });
  });

  it('adds nothing to a project without specs', async () => {
    addFile('libs/ui/src/index.ts');

    expect(await targetsFor('libs/ui')).toBeUndefined();
  });

  it('ignores specs outside src', async () => {
    addFile('libs/ui/tooling/check.spec.ts');

    expect(await targetsFor('libs/ui')).toBeUndefined();
  });
});

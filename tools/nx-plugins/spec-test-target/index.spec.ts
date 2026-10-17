import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  AggregateCreateNodesError,
  type CreateNodesContextV2,
} from '@nx/devkit';
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

  async function targetsFor(projectRoot: string, pluginOptions = options) {
    const configFile = `${projectRoot}/project.json`;
    addFile(configFile);
    const [[, result]] = await createNodes(
      [configFile],
      pluginOptions,
      context,
    );
    return result.projects?.[projectRoot]?.targets;
  }

  it('adds a test target to a project with specs', async () => {
    addFile('libs/ui/src/lib/button/button.spec.ts');

    const test = (await targetsFor('libs/ui'))?.test;

    // Runs on Angular's official runner, borrowing the configured build.
    expect(test?.executor).toBe('@angular/build:unit-test');
    expect(test?.options).toMatchObject({
      buildTarget: 'app:build:development',
      tsConfig: '{projectRoot}/tsconfig.spec.json',
      watch: false,
    });
    // The borrowed build's sources must invalidate the cached result.
    expect(test?.inputs).toContainEqual({
      input: 'production',
      projects: 'app',
    });
  });

  it('treats *.test.ts files as specs, as the builder does', async () => {
    addFile('libs/utils/src/format.test.ts');

    expect(await targetsFor('libs/utils')).toHaveProperty('test');
  });

  it('fails with a pointer to nx.json when buildTarget is missing', async () => {
    addFile('libs/ui/src/button.spec.ts');

    // Nx aggregates per-file plugin errors and reports each one to the user.
    const error = await targetsFor('libs/ui', { buildTarget: '' }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(AggregateCreateNodesError);
    const [[file, cause]] = (error as AggregateCreateNodesError).errors;
    expect(file).toBe('libs/ui/project.json');
    expect(cause.message).toMatch(/"buildTarget" option/);
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

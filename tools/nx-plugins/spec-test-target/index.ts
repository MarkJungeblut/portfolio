import { globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  createNodesFromFiles,
  type CreateNodesContextV2,
  type CreateNodesV2,
  type TargetConfiguration,
} from '@nx/devkit';

export interface SpecTestTargetOptions {
  /** Build target whose config the unit-test builder borrows. */
  buildTarget: string;
}

/**
 * Gives an app or lib a `test` target exactly when it contains specs.
 *
 * Angular's unit-test builder fails with "No tests found" on a project without
 * specs, so the target can't simply exist everywhere. Inferring it means a
 * generated spec runs straight away, rather than silently never running
 * because nobody added the target.
 */
export const createNodesV2: CreateNodesV2<SpecTestTargetOptions> = [
  '{apps,libs}/**/project.json',
  (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile, opts, ctx) => createTestTarget(configFile, opts, ctx),
      configFiles,
      options,
      context,
    ),
];

function createTestTarget(
  configFile: string,
  options: SpecTestTargetOptions | undefined,
  context: CreateNodesContextV2,
) {
  const projectRoot = dirname(configFile);
  // The same files the unit-test builder runs by default.
  const specs = globSync(['src/**/*.spec.ts', 'src/**/*.test.ts'], {
    cwd: join(context.workspaceRoot, projectRoot),
  });
  if (specs.length === 0) {
    return {};
  }
  if (!options?.buildTarget) {
    throw new Error(
      'spec-test-target: set the "buildTarget" option for this plugin in nx.json',
    );
  }

  // Tests compile with the borrowed build's config, so that project's sources
  // must invalidate the cache too — a lib doesn't depend on the app otherwise.
  const buildProject = options.buildTarget.split(':')[0];
  const test: TargetConfiguration = {
    executor: '@angular/build:unit-test',
    cache: true,
    inputs: [
      'default',
      '^production',
      { input: 'production', projects: buildProject },
    ],
    options: {
      buildTarget: options.buildTarget,
      tsConfig: '{projectRoot}/tsconfig.spec.json',
      watch: false,
    },
  };
  return { projects: { [projectRoot]: { targets: { test } } } };
}

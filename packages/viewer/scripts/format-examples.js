#!/usr/bin/env node
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

// This helper runs as part of viewer postbuild because Stencil generates
// `components.d.ts` examples as single-line doc strings, and we need to
// reformat them against the repo Prettier config before publishing.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const rootDir = path.resolve(__dirname, '../../..');
const prettierConfigPath = path.join(rootDir, '.prettierrc.json');
const prettierCliPath = require.resolve('prettier/bin/prettier.cjs');

const stdin = fs.readFileSync(process.stdin.fd, 'utf-8');

const docExampleMatches = stdin.matchAll(/```([^ ]*) (.*) ```/g);
const docMatches = stdin.matchAll(/[ ]*[*](.*)/g);
const typeDefFormattedExamples = [...docExampleMatches].reduce(function (
  typeDefFormattedExamples,
  exampleMatch
) {
  const type = exampleMatch[1];

  const formattedMatch = `\`\`\`${type}\n${formatExample(
    exampleMatch[2],
    type !== '' ? type : undefined
  )}\`\`\``.replace(/^/gm, '* ');

  return typeDefFormattedExamples.replace(
    exampleMatch[0],
    `\n${formattedMatch}`
  );
}, stdin);
const typeDefFormattedMultiline = [...docMatches].reduce(function (
  typeDefFormattedMultiline,
  mutilineMatch
) {
  const indentationMatch = mutilineMatch[0].match(/([ ]*)[*]/);
  const indentation = indentationMatch[1] == null ? '' : indentationMatch[1];
  const formattedMatch = `${indentation}*${mutilineMatch[1].replace(
    /([^ ])[ ]{2}([^ ])/gm,
    `$1\n${indentation}*\n${indentation}* $2`
  )}`;

  return typeDefFormattedMultiline.replace(
    mutilineMatch[0],
    `${formattedMatch}`
  );
}, typeDefFormattedExamples);

process.stdout.write(typeDefFormattedMultiline);

function formatExample(example, parser = 'typescript') {
  return String(
    execFileSync(
      process.execPath,
      [
        prettierCliPath,
        '--parser',
        parser,
        '--config',
        prettierConfigPath,
      ],
      {
        input: example,
        cwd: rootDir,
      }
    )
  );
}

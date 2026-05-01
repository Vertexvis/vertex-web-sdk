#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import { fileURLToPath } from 'url';

// This helper runs as part of viewer postbuild because Stencil generates
// `components.d.ts` examples as single-line doc strings, and we need to
// reformat them against the repo Prettier config before publishing.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const prettierConfigPath = path.join(rootDir, '.prettierrc.json');
const prettierConfig = await prettier.resolveConfig(prettierConfigPath);

const stdin = fs.readFileSync(process.stdin.fd, 'utf-8');

const docExampleMatches = stdin.matchAll(/```([^ ]*) (.*) ```/g);
const docMatches = stdin.matchAll(/[ ]*[*](.*)/g);
let typeDefFormattedExamples = stdin;
for (const exampleMatch of docExampleMatches) {
  const type = exampleMatch[1];

  const formattedMatch = `\`\`\`${type}\n${await formatExample(
    exampleMatch[2],
    type !== '' ? type : undefined
  )}\`\`\``.replace(/^/gm, '* ');

  typeDefFormattedExamples = typeDefFormattedExamples.replace(
    exampleMatch[0],
    `\n${formattedMatch}`
  );
}
let typeDefFormattedMultiline = typeDefFormattedExamples;
for (const mutilineMatch of docMatches) {
  const indentationMatch = mutilineMatch[0].match(/([ ]*)[*]/);
  const indentation = indentationMatch[1] == null ? '' : indentationMatch[1];
  const formattedMatch = `${indentation}*${mutilineMatch[1].replace(
    /([^ ])[ ]{2}([^ ])/gm,
    `$1\n${indentation}*\n${indentation}* $2`
  )}`;

  typeDefFormattedMultiline = typeDefFormattedMultiline.replace(
    mutilineMatch[0],
    `${formattedMatch}`
  );
}

process.stdout.write(typeDefFormattedMultiline);

async function formatExample(example, parser = 'typescript') {
  return await prettier.format(example, {
    ...prettierConfig,
    parser,
  });
}

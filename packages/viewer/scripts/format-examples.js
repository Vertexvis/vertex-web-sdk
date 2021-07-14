#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const stdin = fs.readFileSync(process.stdin.fd, 'utf-8');

const docExampleMatches = stdin.matchAll(/``` (.*) ```/g);
const typeDefNewFormatted = [...docExampleMatches].reduce(function (
  typeDefNewFormatted,
  exampleMatch
) {
  const formattedMatch = `\`\`\`\n${formatExample(
    exampleMatch[1]
  )}\`\`\``.replace(/^/gm, '* ');

  return typeDefNewFormatted.replace(exampleMatch[0], `\n${formattedMatch}`);
},
stdin);

process.stdout.write(typeDefNewFormatted);

function formatExample(example) {
  return String(
    execSync(
      'yarn -s prettier --parser typescript --config ../../.prettierrc.json',
      {
        input: example,
      }
    )
  );
}

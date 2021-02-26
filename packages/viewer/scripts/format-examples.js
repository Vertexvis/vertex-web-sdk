#!/usr/bin/env node
const { execSync } = require('child_process');

process.stdin.once('readable', async function () {
  const typeDefTxt = String(process.stdin.read());
  const docExampleMatches = typeDefTxt.matchAll(/``` (.*) ```/g);
  const typeDefNewFormatted = [...docExampleMatches].reduce(function (
    typeDefNewFormatted,
    exampleMatch
  ) {
    const formattedMatch = `\`\`\`\n${formatExample(
      exampleMatch[1]
    )}\`\`\``.replace(/^/gm, '* ');

    return typeDefNewFormatted.replace(exampleMatch[0], `\n${formattedMatch}`);
  },
  typeDefTxt);
  process.stdout.write(typeDefNewFormatted);
});

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

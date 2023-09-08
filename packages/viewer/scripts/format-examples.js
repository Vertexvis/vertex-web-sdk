#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

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
},
stdin);
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
},
typeDefFormattedExamples);

process.stdout.write(typeDefFormattedMultiline);

function formatExample(example, parser = 'typescript') {
  return String(
    execSync(
      `yarn -s prettier --parser ${parser} --config ../../.prettierrc.json`,
      {
        input: example,
      }
    )
  );
}

import fs from 'node:fs/promises';

await fs.copyFile('component-definition.json', 'component-definitions.json');

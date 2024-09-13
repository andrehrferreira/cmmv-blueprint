import * as fs from 'fs';
import * as fg from 'fast-glob';

(async _ => {
    const files = await fg([
        './src/nodes/**/*.node.json', 
        './src/nodes/*.node.json',
        './packages/nodes/*.node.json',
        './packages/nodes/**/*.node.json'
    ], {
        ignore: ['node_modules/**'],
        cwd: process.cwd()
    });

    for await(let filename of files)
        fs.copyFileSync(filename, filename.replace("src/", "dist/"));
})();
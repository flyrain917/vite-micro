import { cac } from 'cac';

// import colors from 'picocolors' // cmd color
const cli = cac();
console.log('====11=');
// dev
cli
    .command('[root]', 'start dev server') // default command
    .alias('serve')
    .action(async (root, options) => {
    // output structure is preserved even after bundling so require()
    // is ok here
    const { createMicroServer } = await import('./server-e5bc2fbd.js');
    try {
        const { app } = await createMicroServer();
        app.listen(8080, () => {
            console.log('http://localhost:8080');
        });
    }
    catch (e) {
        console.log('==ecreateMicroServer====', e);
        process.exit(1);
    }
});
cli.help();
cli.parse();

const { exec } = require('child_process');

console.log('Running ls -R dist/');
exec('ls -R dist/', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});

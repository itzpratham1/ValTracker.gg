const fs = require('fs');

const content = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);

if (scriptMatch) {
    const jsCode = scriptMatch[1];
    try {
        new Function(jsCode);
        console.log("Syntax is valid!");
    } catch (e) {
        console.log("Syntax error found:");
        console.error(e.message);
        
        // Also let's find the exact line by trying to execute it with node directly
        // Writing to a temp file and using child_process
        fs.writeFileSync('temp.js', jsCode);
        const { execSync } = require('child_process');
        try {
            execSync('node\\node-v20.11.1-win-x64\\node.exe -c temp.js', {stdio: 'pipe'});
        } catch (err) {
            console.error(err.stderr.toString());
        }
    }
} else {
    console.log("No script tag found");
}

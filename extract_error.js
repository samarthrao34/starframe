const fs = require('fs');

try {
    const log = fs.readFileSync('startup_error.log', 'utf8');
    const lines = log.split('\\n');
    let out = '';
    for (const line of lines) {
        if (line.includes('uncaughtException') || line.includes('"stack":')) {
            try {
                const jsonStr = line.substring(line.indexOf('{'));
                const parsed = JSON.parse(jsonStr);
                out += '\\n--- CRASH STACK TRACE ---\\n';
                out += parsed.stack || parsed.message || JSON.stringify(parsed, null, 2);
            } catch (e) {
            }
        }
    }
    if (!out) {
        out = 'No parsed JSON. Raw end of log:\\n' + log.slice(-2000);
    }
    fs.writeFileSync('parsed_error.txt', out);
    console.log('Wrote parsed_error.txt');
} catch (e) {
    console.error(e);
}

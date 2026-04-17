const fs = require('fs');
const path = require('path');

const buttonHTML = `
    <!-- Back to Top Button -->
    <button id="backToTop" class="back-to-top" aria-label="Back to top">
      <i class="fas fa-arrow-up"></i>
    </button>
`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('id="backToTop"')) {
        console.log(`Skipping ${filePath} - already has back to top button`);
        return;
    }

    if (content.includes('</body>')) {
        content = content.replace('</body>', buttonHTML + '\n</body>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`WARNING: ${filePath} has no </body> tag`);
    }
}

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
files.forEach(f => processFile(path.join(__dirname, f)));

// Also check admin dir
const adminDir = path.join(__dirname, 'admin');
if (fs.existsSync(adminDir)) {
    const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('.html'));
    adminFiles.forEach(f => processFile(path.join(adminDir, f)));
}

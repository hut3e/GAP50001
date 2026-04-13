const fs = require('fs');
const glob = require('glob'); // Note: we can just use native fs since it's a small codebase
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function fixFlex() {
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jsx'));
    let changedFiles = 0;
    for (const f of files) {
        const fp = path.join(srcDir, f);
        let content = fs.readFileSync(fp, 'utf-8');
        let original = content;

        // Find standard flex space-between rows and add flexWrap wrap if not present
        // Looking for variations of display: "flex", justifyContent: "space-between"
        const rg = /display\s*:\s*["']flex["'][^}]*justifyContent\s*:\s*["']space-between["']/g;
        let match;
        const toReplace = [];
        while ((match = rg.exec(content)) !== null) {
            const block = match[0];
            if (!block.includes('flexWrap')) {
                // Add flexWrap and gap (if gap is missing)
                let newBlock = block + ', flexWrap: "wrap"';
                if (!block.includes('gap')) {
                    newBlock += ', gap: 10';
                }
                toReplace.push({ old: block, new: newBlock });
            }
        }

        // Deduplicate
        const uniqueReplacements = [...new Set(toReplace.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));
        
        for (const repl of uniqueReplacements) {
            content = content.split(repl.old).join(repl.new);
        }

        if (content !== original) {
            fs.writeFileSync(fp, content, 'utf-8');
            changedFiles++;
            console.log(`Updated flex containers in ${f}`);
        }
    }
    console.log(`Fixed flex in ${changedFiles} files`);
}

function fixGridAtom() {
    const fp = path.join(srcDir, 'gap.atoms.jsx');
    let content = fs.readFileSync(fp, 'utf-8');
    
    // Add media query
    if (!content.includes('.gap-grid-responsive')) {
        content = content.replace(
            /export const GLOBAL_CSS = `/,
            "export const GLOBAL_CSS = `\n@media (max-width: 768px) {\n  .gap-grid-responsive { grid-template-columns: 1fr !important; }\n}\n"
        );
    }

    // Change Grid component
    const oldGridRegex = /<div style={{\s*display:\s*"grid",\s*gridTemplateColumns:[^}]+,\s*gap,\s*}}>\{children\}<\/div>/;
    const newGridStr = `<div className="gap-grid-responsive" style={{
    display: "grid",
    gridTemplateColumns: cols ? \`repeat(\${cols}, minmax(0, 1fr))\` : \`repeat(auto-fill, minmax(\${minCol}, 1fr))\`,
    gap,
  }}>{children}</div>`;

    let replaced = false;
    content = content.replace(/export const Grid = \(\{([^}]+)\}\) => \(([\s\S]*?)\);/, (match, p1, p2) => {
        replaced = true;
        return `export const Grid = ({${p1}}) => (\n  ${newGridStr}\n);`;
    });

    if (replaced || content.includes('.gap-grid-responsive')) {
        fs.writeFileSync(fp, content, 'utf-8');
        console.log(`Updated gap.atoms.jsx Grid to use reliable media queries.`);
    }
}

fixGridAtom();
fixFlex();

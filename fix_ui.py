import os
import re

src_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'src')

def fix_flex():
    changed_files = 0
    for f in os.listdir(src_dir):
        if f.endswith('.jsx'):
            fp = os.path.join(src_dir, f)
            with open(fp, 'r', encoding='utf-8') as file:
                content = file.read()
            original = content
            
            # Find display: "flex", justifyContent: "space-between" and replace
            rg = re.compile(r'display\s*:\s*["\']flex["\'][^}]+?justifyContent\s*:\s*["\']space-between["\']')
            matches = rg.findall(content)
            
            for block in set(matches):
                if 'flexWrap' not in block:
                    new_block = block + ', flexWrap: "wrap"'
                    if 'gap' not in block:
                        new_block += ', gap: 10'
                    content = content.replace(block, new_block)
            
            if content != original:
                with open(fp, 'w', encoding='utf-8') as file:
                    file.write(content)
                changed_files += 1
                print(f"Updated flex containers in {f}")
    print(f"Fixed flex in {changed_files} files")

def fix_grid_atom():
    fp = os.path.join(src_dir, 'gap.atoms.jsx')
    with open(fp, 'r', encoding='utf-8') as file:
        content = file.read()
        
    original = content
    
    if '.gap-grid-responsive' not in content:
        content = content.replace('export const GLOBAL_CSS = `', "export const GLOBAL_CSS = `\n@media (max-width: 768px) {\n  .gap-grid-responsive { grid-template-columns: 1fr !important; }\n}\n")
        
    new_grid = """<div className="gap-grid-responsive" style={{
    display: "grid",
    gridTemplateColumns: cols ? `repeat(${cols}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${minCol}, 1fr))`,
    gap,
  }}>{children}</div>"""
  
    content = re.sub(r'export const Grid = \(\{([^}]+)\}\) => \(([\s\S]*?)\);', 
                     lambda m: f"export const Grid = ({{{m.group(1)}}}) => (\n  {new_grid}\n);", 
                     content)
                     
    if content != original:
        with open(fp, 'w', encoding='utf-8') as file:
            file.write(content)
        print("Updated gap.atoms.jsx Grid to use reliable media queries.")

fix_grid_atom()
fix_flex()

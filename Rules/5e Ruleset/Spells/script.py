import os
import re

# Get list of md files
files = [f for f in os.listdir('.') if f.endswith('.md') and f != '## Spell Lists.md']

# Create mapping
spell_to_file = {}
for f in files:
    spell = f[:-3].replace('%20', ' ')
    if 'Antipathy' in f:
        spell = 'Antipathy/Sympathy'
    elif 'Blindness' in f:
        spell = 'Blindness/Deafness'
    spell_to_file[spell] = f

# Read the file
with open('## Spell Lists.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace
for spell, file in spell_to_file.items():
    # Find - spell
    pattern = r'- ' + re.escape(spell) + r'\n'
    replacement = f'- [{spell}]({file})\n'
    content = re.sub(pattern, replacement, content)

# Write back
with open('## Spell Lists.md', 'w', encoding='utf-8') as f:
    f.write(content)
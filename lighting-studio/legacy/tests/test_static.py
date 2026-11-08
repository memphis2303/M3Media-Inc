from pathlib import Path
import re, subprocess
root=Path(__file__).resolve().parents[1]; html=(root/'index.html').read_text()
assert '<title>LightCraft' in html
for id in ['styles','subj','dia','s3','save','saved','rP','mOut','v8-canvas','v8-plan','v8-apply','v8-recipes','v8-export-json','v8-file']:
 assert f'id="{id}"' in html,id
assert 'const recipes=' in html and html.count("'Low-key bodyscape'")==1
assert (root/'assets/reference-photos').exists()
for i,js in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S)):
 subprocess.run(['node','--check'],input=js,text=True,check=True,capture_output=True)
print('PASS: original controls, V8 controls, assets and JavaScript syntax')

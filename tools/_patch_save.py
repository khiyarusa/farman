import io
p='src/save/storage.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("    this.data = this.read();\n  }", "    this.data = this.read();\n    // Persist the initial save immediately so settings/progress survive a reload\n    // even if the player never changes anything.\n    this.dirty = true;\n    this.flush();\n  }")
io.open(p,'w',encoding='utf-8',newline='').write(s)

p='src/app.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("    this.applyUiScale();\n    this.lastFrame = performance.now();", "    this.applyUiScale();\n    this.lastFrame = performance.now();\n    const persist = (): void => this.saveStore.flush();\n    window.addEventListener('pagehide', persist);\n    document.addEventListener('visibilitychange', () => {\n      if (document.visibilityState === 'hidden') persist();\n    });")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('save persistence patched')

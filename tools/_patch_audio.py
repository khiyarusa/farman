import io
p='src/audio/audio.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("  mute(muted: boolean): void {", "  /** Fades the driving beds out when the player leaves the road. */\n  silence(): void {\n    if (!this.ctx) return;\n    const now = this.ctx.currentTime;\n    this.engineBus.gain.setTargetAtTime(0, now, 0.15);\n    this.tireBus.gain.setTargetAtTime(0, now, 0.15);\n    this.ambienceBus.gain.setTargetAtTime(0, now, 0.3);\n  }\n\n  mute(muted: boolean): void {")
io.open(p,'w',encoding='utf-8',newline='').write(s)

p='src/app.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("import { TrafficSystem } from './traffic/traffic';", "import { TrafficSystem } from './traffic/traffic';\nimport { AudioEngine } from './audio/audio';")
s=s.replace("  readonly version = APP.version;\n  isNative = false;", "  readonly version = APP.version;\n  readonly audio = new AudioEngine();\n  isNative = false;")
s=s.replace("    this.applyUiScale();\n    this.lastFrame = performance.now();", "    this.applyUiScale();\n    this.lastFrame = performance.now();\n    const startAudio = (): void => {\n      void this.audio.start().then(() => {\n        const s = this.save.settings;\n        this.audio.setVolumes(s.masterVolume, s.engineVolume, s.ambienceVolume, s.uiVolume);\n      });\n      window.removeEventListener('pointerdown', startAudio);\n      window.removeEventListener('keydown', startAudio);\n    };\n    window.addEventListener('pointerdown', startAudio);\n    window.addEventListener('keydown', startAudio);\n    this.ui.root.addEventListener('click', (ev) => {\n      const target = ev.target as HTMLElement | null;\n      if (target && target.closest('button')) this.audio.ui('click');\n    });")
s=s.replace("    if (key === 'uiScale') this.applyUiScale();", "    if (key === 'uiScale') this.applyUiScale();\n    const st = this.save.settings;\n    if (key === 'masterVolume' || key === 'engineVolume' || key === 'ambienceVolume' || key === 'uiVolume') {\n      this.audio.setVolumes(st.masterVolume, st.engineVolume, st.ambienceVolume, st.uiVolume);\n    }")
s=s.replace("    this.processKeyboardActions();\n    world.update(vehicle, dt);", "    this.processKeyboardActions();\n    this.audio.update(\n      vehicle.telemetry,\n      this.selectedProfile.audio.firingHzAt1000,\n      vehicle.telemetry.groundSurface,\n      this.mission?.weather === 'rain',\n      this.paused,\n    );\n    world.update(vehicle, dt);")
s=s.replace("    this.missionRunner = null;\n    this.mission = null;\n    this.missionEndTimer = 0;", "    this.missionRunner = null;\n    this.mission = null;\n    this.missionEndTimer = 0;\n    this.audio.silence();")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('audio wired')

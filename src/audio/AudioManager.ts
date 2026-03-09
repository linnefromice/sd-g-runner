import { Audio } from 'expo-av';

type SoundId =
  | 'shoot'
  | 'enemyDestroy'
  | 'gatePass'
  | 'refit'
  | 'damage'
  | 'exBurst'
  | 'bossAppear'
  | 'awaken';

type BgmId = 'stage' | 'boss';

class AudioManagerClass {
  private sounds: Map<string, Audio.Sound> = new Map();
  private bgm: Audio.Sound | null = null;
  private bgmVolume = 0.7;
  private seVolume = 1.0;

  async init() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }

  setVolumes(bgm: number, se: number) {
    this.bgmVolume = bgm;
    this.seVolume = se;
    this.bgm?.setVolumeAsync(bgm);
  }

  async playBgm(_id: BgmId) {
    // TODO: Load actual BGM files when available
    // Placeholder: no-op until audio assets are added
  }

  async stopBgm() {
    if (this.bgm) {
      await this.bgm.stopAsync();
      await this.bgm.unloadAsync();
      this.bgm = null;
    }
  }

  async playSe(_id: SoundId) {
    // TODO: Load actual SE files when available
    // Placeholder: no-op until audio assets are added
  }

  async cleanup() {
    await this.stopBgm();
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const AudioManager = new AudioManagerClass();

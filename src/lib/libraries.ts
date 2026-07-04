// ── لود کتابخانه‌های صحنه/نور/دوربین/سبک/پلتفرم ─────────────
import scenes from '../../data/libraries/scenes.json';
import lighting from '../../data/libraries/lighting.json';
import camera from '../../data/libraries/camera.json';
import styles from '../../data/libraries/styles.json';
import platforms from '../../data/libraries/platforms.json';

export interface LibItem {
  id: string;
  label_fa: string;
  prompt?: string;
  [key: string]: unknown;
}

export const LIB = {
  scenes: scenes.items as LibItem[],
  lighting: lighting.items as LibItem[],
  cameraShots: camera.shots as LibItem[],
  cameraMoves: camera.moves as LibItem[],
  styles: styles.items as LibItem[],
  platforms: platforms.items as (LibItem & {
    aspect_ratio: string;
    type: string;
    recommended_duration_s?: number;
  })[],
};

export function findLib(list: LibItem[], id: string): LibItem | undefined {
  return list.find((i) => i.id === id);
}

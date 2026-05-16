import type { Mesh, Object3D, SkinnedMesh } from "three";

export type LipMorphBinding = {
  mesh: Mesh | SkinnedMesh;
  indices: number[];
};

const PREFERRED_NAMES = [
  "jawOpen",
  "mouthOpen",
  "mouth_open",
  "viseme_aa",
  "Aa",
  "aa",
  "Jaw",
  "Open",
  "MouthOpen",
  "mouthSmile",
];

/**
 * Find meshes with morph targets that likely control the mouth / jaw.
 * Meshy image-to-3d GLBs often have none; Ready Player Me / VRoid exports do.
 */
export function findLipMorphBindings(root: Object3D): LipMorphBinding[] {
  const out: LipMorphBinding[] = [];
  root.traverse((obj) => {
    if (!("isMesh" in obj) || !(obj as Mesh).isMesh) return;
    const mesh = obj as Mesh | SkinnedMesh;
    const dict = mesh.morphTargetDictionary;
    const infl = mesh.morphTargetInfluences;
    if (!dict || !infl?.length) return;

    const indices: number[] = [];
    for (const name of PREFERRED_NAMES) {
      if (name in dict) indices.push(dict[name]!);
    }
    if (indices.length === 0) {
      for (const k of Object.keys(dict)) {
        const low = k.toLowerCase();
        if (
          low.includes("mouth") ||
          low.includes("jaw") ||
          low.includes("lip") ||
          low.includes("viseme")
        ) {
          indices.push(dict[k]!);
          break;
        }
      }
    }
    if (indices.length > 0) out.push({ mesh, indices });
  });
  return out;
}

export function setLipBindingsOpenness(
  bindings: LipMorphBinding[],
  value01: number
): void {
  const v = Math.max(0, Math.min(1, value01));
  for (const { mesh, indices } of bindings) {
    const infl = mesh.morphTargetInfluences;
    if (!infl) continue;
    for (const i of indices) {
      infl[i] = v;
    }
  }
}

import {
  CatmullRomCurve3,
  Color,
  DataTexture,
  Float32BufferAttribute,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  TubeGeometry,
  Vector3,
} from "three";

/**
 * The thread path — an overhand knot, sampled and swept as a tube.
 *
 * **Why not `torusKnotGeometry` any more.** The old sculpture was a stock
 * (2,3) torus knot, which is the single most recognisable "someone reached for
 * a three.js primitive" shape on the web: the winding is perfectly regular and
 * the tube is wound tight around a torus, so it reads as machined tubing, not
 * as thread. This is a trefoil — mathematically the simplest *actual* knot, and
 * physically what you get when a thread is tied once around itself, which is
 * the brand's own description of the motif (SKILL.md §5, form 4).
 *
 * The parametric trefoil is then deliberately taken out of true: squashed
 * slightly on Y and given a small secondary z-warp, so the loop looks laid down
 * by hand rather than solved. That asymmetry is most of the difference between
 * "thread" and "3D shape".
 */
function trefoil(t: number, target: Vector3): Vector3 {
  const a = t * Math.PI * 2;
  return target.set(
    (Math.sin(a) + 2 * Math.sin(2 * a)) * 0.38,
    // 0.92 on Y: a knot lying on a surface is never perfectly round.
    (Math.cos(a) - 2 * Math.cos(2 * a)) * 0.38 * 0.92,
    -Math.sin(3 * a) * 0.4 + Math.sin(2 * a) * 0.05,
  );
}

/** Closed Catmull-Rom through sampled trefoil points. */
export function threadCurve(samples = 160): CatmullRomCurve3 {
  const points: Vector3[] = [];
  for (let i = 0; i < samples; i++) {
    points.push(trefoil(i / samples, new Vector3()));
  }
  // "catmullrom" with closed=true gives C1 continuity across the seam, so the
  // swept tube has no visible kink where the path joins itself.
  return new CatmullRomCurve3(points, true, "catmullrom", 0.5);
}

/**
 * Swept tube plus a per-vertex colour ramp along its length.
 *
 * The ramp runs `deep → bright → deep` twice around the loop. Two cycles rather
 * than one so that the colour reads as light travelling along a fibre instead
 * of one half of the knot simply being darker than the other, and an even
 * number so the ramp is continuous across the closed seam.
 *
 * `TubeGeometry` lays vertices out as (tubularSegments + 1) rows of
 * (radialSegments + 1) — one row per step along the path — so the ramp is a
 * function of the row index alone.
 */
export function buildThreadGeometry({
  tubularSegments,
  radius,
  radialSegments,
  deep,
  bright,
}: {
  tubularSegments: number;
  radius: number;
  radialSegments: number;
  deep: string;
  bright: string;
}): TubeGeometry {
  const geometry = new TubeGeometry(
    threadCurve(),
    tubularSegments,
    radius,
    radialSegments,
    true,
  );

  const a = new Color(deep);
  const b = new Color(bright);
  const mixed = new Color();
  const colors = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 3);

  let offset = 0;
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    // cos gives a smooth ramp with zero derivative at both ends, so the two
    // cycles meet without a visible band.
    const mix = 0.5 - 0.5 * Math.cos(u * Math.PI * 4);
    mixed.copy(a).lerp(b, mix);
    for (let j = 0; j <= radialSegments; j++) {
      colors[offset++] = mixed.r;
      colors[offset++] = mixed.g;
      colors[offset++] = mixed.b;
    }
  }

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

/**
 * A 64×1 roughness ramp, generated in memory.
 *
 * `MeshPhysicalMaterial` takes one scalar roughness for the whole surface,
 * which is what makes an untextured tube read as extruded plastic — real fibre
 * is duller where it is twisted tight and glossier where it lies flat. A map is
 * the only way to vary it, and generating one costs 256 bytes of RAM and **zero
 * network bytes**, which an HDR environment or a fibre texture would not.
 *
 * three reads roughness from the **green** channel (metalness from blue, AO
 * from red), so the variation has to live in G specifically — a red-format
 * texture here would silently do nothing.
 *
 * `TubeGeometry`'s `u` runs along the path, so a 64-wide texture repeated in S
 * lays the variation down the length of the thread rather than around it.
 */
export function buildRoughnessRamp(): DataTexture {
  const width = 64;
  const data = new Uint8Array(width * 4);

  for (let i = 0; i < width; i++) {
    const u = i / width;
    // Two summed sines at incommensurate-ish rates: the pattern does not
    // obviously repeat over the length of the knot.
    const n =
      0.5 + 0.28 * Math.sin(u * Math.PI * 6) + 0.16 * Math.sin(u * Math.PI * 14 + 1.7);
    const g = Math.round(Math.min(1, Math.max(0, n)) * 255);
    data[i * 4] = 255; // R — AO, unused here but must not be black
    data[i * 4 + 1] = g; // G — roughness
    data[i * 4 + 2] = 0; // B — metalness, driven by the material scalar
    data[i * 4 + 3] = 255;
  }

  const texture = new DataTexture(data, width, 1, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

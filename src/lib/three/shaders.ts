/* Ported verbatim from the design file (Kura Portfolio.dc.html, lines 422-515).
   Do not reformat the GLSL — the strings are the contract. */

/*
 * Background: a slow flowing gradient, ordered-dithered into steps.
 *
 * The previous shader was fbm noise, which read as drifting purple clouds and
 * pulled the eye — wrong for something sitting behind every page. This is a
 * smooth low-frequency field quantised to a handful of steps through a Bayer
 * matrix, so the transitions between bands resolve as dot patterns rather than
 * as gradients. The texture is the dither, not the colour.
 *
 * Sines rather than noise: no visible tiling, no texture lookups, and cheap
 * enough that a machine without hardware acceleration is not the reason it
 * exists. The palette is built from #0B01FF.
 */
export const CLOUD_FRAG = [
  "precision highp float;",
  "uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uDark;",
  // Compact ordered dither. bayer2 is the 2x2 threshold map as arithmetic;
  // each level up interleaves a half-scale copy, giving 4x4 then 8x8 without
  // an array lookup, which GLSL ES 1.0 makes awkward.
  "float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }",
  "float bayer4(vec2 a){ return bayer2(a * 0.5) * 0.25 + bayer2(a); }",
  "float bayer8(vec2 a){ return bayer4(a * 0.5) * 0.25 + bayer2(a); }",
  "void main(){",
  "  vec2 uv = gl_FragCoord.xy / uRes.xy;",
  "  float asp = uRes.x / max(uRes.y, 1.0);",
  "  vec2 p = vec2(uv.x * asp, uv.y);",
  // Fast enough to read as movement without asking to be watched. At 0.035
  // the field drifted so slowly it looked static.
  "  float t = uTime * 0.105;",
  // Three waves at unrelated frequencies, one modulating another. Slow enough
  // to read as ambient rather than as animation.
  "  float v = sin(p.x * 2.3 + t * 1.1);",
  "  v += sin(p.y * 2.7 - t * 0.8 + sin(p.x * 1.5 + t * 0.5) * 1.7);",
  "  v += sin((p.x * 1.4 + p.y * 1.9) - t * 0.65) * 0.95;",
  "  v = v / 2.9 * 0.5 + 0.5;",
  // A soft lift under the pointer, enough to feel alive on a still page.
  "  vec2 mp = vec2(uMouse.x * asp, uMouse.y) + vec2(asp, 1.0) * 0.5;",
  "  float md = distance(p, mp);",
  "  v += 0.12 / (1.0 + md * md * 9.0);",
  // Darker toward the top of the viewport: the header sits there on every
  // page and white type needs the contrast.
  // Centred on 0.5, with only a slight top-down bias. A heavier bias pushed
  // most of the viewport past the top threshold, which is why the texture
  // collected in one corner and everything below it went flat.
  "  v = clamp(v * 1.0 - uv.y * 0.1 + 0.05, 0.0, 1.0);",
  // Quantise. The dither offset is applied BEFORE the floor, which is what
  // turns a hard band edge into a dot pattern instead of a stair.
  // Three tones, not seven. Dots only appear where two bands meet, so a
  // finely-stepped ramp gives thin seams and reads as a smooth gradient with
  // grain. Collapsing to three makes each transition a wide dithered field,
  // which is the halftone look this is after.
  "  float steps = 3.0;",
  "  float q = clamp(floor(v * steps + (bayer8(gl_FragCoord.xy * 0.5) - 0.5)) / (steps - 1.0), 0.0, 1.0);",
  "  vec3 c0 = vec3(0.012, 0.006, 0.055);",
  "  vec3 c1 = vec3(0.031, 0.004, 0.560);",
  "  vec3 c2 = vec3(0.043, 0.004, 1.000);",
  "  vec3 col = mix(c0, c1, smoothstep(0.0, 0.66, q));",
  "  col = mix(col, c2, smoothstep(0.66, 1.0, q));",
  "  col = mix(col, col * 0.26, uDark);",
  "  gl_FragColor = vec4(col, 1.0);",
  "}",
].join("\n");

export const LOGO_VERT = [
  "varying vec3 vN; varying vec3 vP; varying float vD;",
  "void main(){",
  "  vN = normalize(normalMatrix * normal);",
  "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
  "  vP = mv.xyz;",
  "  vD = position.z * 0.02;",
  "  gl_Position = projectionMatrix * mv;",
  "}",
].join("\n");

export const LOGO_FRAG = [
  "precision highp float;",
  "uniform float uTime;",
  "varying vec3 vN; varying vec3 vP; varying float vD;",
  "void main(){",
  "  vec3 n = normalize(vN);",
  "  vec3 v = normalize(-vP);",
  "  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);",
  "  vec3 core = vec3(0.20, 0.09, 0.85);",
  "  vec3 mid  = vec3(0.55, 0.42, 1.00);",
  "  vec3 hot  = vec3(0.92, 0.86, 0.68);",
  "  vec3 ice  = vec3(0.72, 0.90, 1.00);",
  "  float band = sin(vD * 22.0 + uTime * 0.7) * 0.5 + 0.5;",
  "  vec3 col = mix(core, mid, band);",
  "  col = mix(col, ice, fres * 0.85);",
  "  float spec = pow(max(dot(reflect(-v, n), normalize(vec3(0.35, 0.75, 0.6))), 0.0), 30.0);",
  "  col += hot * spec * 0.65;",
  "  gl_FragColor = vec4(col, 1.0);",
  "}",
].join("\n");

export const BOW_VERT = [
  "uniform float uVelocity; varying vec2 vUv;",
  "void main(){",
  "  vUv = uv;",
  "  vec3 p = position;",
  "  float arch = cos((uv.x - 0.5) * 3.14159265);",
  "  p.y += arch * uVelocity;",
  "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
  "}",
].join("\n");

export const BOW_FRAG = [
  "precision highp float;",
  "uniform sampler2D uTex; uniform vec2 uSize; uniform vec2 uImg; uniform float uRadius; uniform float uAlpha;",
  "varying vec2 vUv;",
  "float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r; }",
  "void main(){",
  "  float ar = uSize.x / max(uSize.y, 1.0);",
  "  float ia = uImg.x / max(uImg.y, 1.0);",
  "  vec2 uv = vUv;",
  "  if (ar > ia) { uv.y = (uv.y - 0.5) * (ia / ar) + 0.5; }",
  "  else { uv.x = (uv.x - 0.5) * (ar / ia) + 0.5; }",
  "  vec4 tex = texture2D(uTex, uv);",
  "  vec2 p = (vUv - 0.5) * uSize;",
  "  float d = sdRound(p, uSize * 0.5, uRadius);",
  "  float a = 1.0 - smoothstep(0.0, 1.5, d);",
  "  gl_FragColor = vec4(tex.rgb, tex.a * a * uAlpha);",
  "}",
].join("\n");

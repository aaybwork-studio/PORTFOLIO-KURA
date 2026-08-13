import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { LOGO_FRAG, LOGO_VERT } from "./shaders";

export type Uniforms = { [k: string]: THREE.IUniform };
export type LogoSize = { w: number; h: number };

/* Design file line 1014-1016 — verbatim. */
export function logoMaterial(uniforms: Uniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: LOGO_VERT,
    fragmentShader: LOGO_FRAG,
    uniforms: uniforms,
    side: THREE.DoubleSide,
  });
}

/* Design file lines 1018-1044 — verbatim, except the design's `ensureSVGLoader`
   script-injection wrapper is replaced by the static ESM import above, and the
   fetch path gains a leading slash because the SVG lives in `public/`. */
export function buildLogo(
  uniforms: Uniforms,
  targetW: number,
  cb: (wrap: THREE.Group, size: LogoSize) => void,
): void {
  fetch("/media/logo-white.svg")
    .then((r) => r.text())
    .then((txt) => {
      const data = new SVGLoader().parse(txt);
      const holder = new THREE.Group();
      const mat = logoMaterial(uniforms);
      data.paths.forEach((path) => {
        SVGLoader.createShapes(path).forEach((shape) => {
          const g = new THREE.ExtrudeGeometry(shape, {
            depth: 34,
            bevelEnabled: true,
            bevelThickness: 7,
            bevelSize: 5,
            bevelSegments: 2,
            curveSegments: 12,
          });
          g.computeVertexNormals();
          holder.add(new THREE.Mesh(g, mat));
        });
      });
      if (!holder.children.length) return;
      holder.scale.y = -1;
      const box = new THREE.Box3().setFromObject(holder);
      const size = box.getSize(new THREE.Vector3());
      holder.position.sub(box.getCenter(new THREE.Vector3()));
      const wrap = new THREE.Group();
      wrap.add(holder);
      const s = targetW / Math.max(size.x, 0.0001);
      wrap.scale.setScalar(s);
      cb(wrap, { w: targetW, h: size.y * s });
    })
    .catch(() => {});
}

/* Design file lines 1046-1052 — verbatim. */
export function extrude(
  shape: THREE.Shape,
  depth: number,
  uniforms: Uniforms,
): THREE.Mesh {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.28,
    bevelSize: depth * 0.22,
    bevelSegments: 3,
    curveSegments: 18,
  });
  g.center();
  g.computeVertexNormals();
  return new THREE.Mesh(g, logoMaterial(uniforms));
}

/* Design file lines 1054-1062 — verbatim. */
export function roundRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/*
 * Work icon — a folder.
 *
 * The design shipped a briefcase with a keyhole, which read as "business"
 * rather than "here is the work". A folder says the same thing as the link it
 * sits on. Built as two extruded plates: a back panel with the tab, and a
 * front panel tilted forward so the two faces catch the light differently and
 * the object reads as open rather than as one slab.
 */
export function buildWorkIcon(uniforms: Uniforms): THREE.Group {
  const g = new THREE.Group();

  // Back panel: body up to y=0.30, with the tab stepping up to 0.44 on the left.
  const back = new THREE.Shape();
  const r = 0.07;
  back.moveTo(-0.55 + r, -0.42);
  back.lineTo(0.55 - r, -0.42);
  back.quadraticCurveTo(0.55, -0.42, 0.55, -0.42 + r);
  back.lineTo(0.55, 0.3 - r);
  back.quadraticCurveTo(0.55, 0.3, 0.55 - r, 0.3);
  back.lineTo(-0.02, 0.3);
  back.lineTo(-0.13, 0.45);
  back.lineTo(-0.55 + r, 0.45);
  back.quadraticCurveTo(-0.55, 0.45, -0.55, 0.45 - r);
  back.lineTo(-0.55, -0.42 + r);
  back.quadraticCurveTo(-0.55, -0.42, -0.55 + r, -0.42);
  const backMesh = extrude(back, 0.14, uniforms);
  g.add(backMesh);

  // Front panel, tipped away from the back so the fold reads.
  const front = roundRect(1.06, 0.64, 0.08);
  const frontMesh = extrude(front, 0.12, uniforms);
  frontMesh.position.set(0, -0.09, 0.17);
  frontMesh.rotation.x = -0.16;
  g.add(frontMesh);

  return g;
}

/*
 * The cursor cannot use `logoMaterial`.
 *
 * That shader is a translucent glass, which is right for a 500px hero logo
 * floating over the cloud and completely illegible at 46px — the first build
 * of this rendered an arrow that simply could not be seen against the blue.
 * This is opaque and shaded off the surface normal instead, so it still reads
 * as the same extruded-plastic family while holding contrast at cursor size.
 */
function cursorMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vN;
      void main() {
        float d = clamp(dot(normalize(vN), normalize(vec3(0.35, 0.72, 0.8))), 0.0, 1.0);
        // Faces pointing at the key light go white; the sides fall to the
        // site's violet so the bevel stays visible against a blue page.
        vec3 col = mix(vec3(0.40, 0.34, 0.94), vec3(1.0), 0.22 + 0.78 * pow(d, 1.5));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}

/*
 * Cursor — the pointer itself.
 *
 * The outline is the classic arrow cursor (the 0,0 / 0,16 / 4,12 / 7,19 /
 * 10,18 / 7,11 / 12,11 polygon), converted from screen coordinates into this
 * scene's y-up space. Keeping the familiar silhouette matters: a custom cursor
 * that is not instantly readable as a cursor costs the visitor a beat every
 * time they look for it.
 */
export function buildCursorIcon(): THREE.Group {
  const g = new THREE.Group();
  const arrow = new THREE.Shape();
  const pts: [number, number][] = [
    [-0.36, 0.57],
    [-0.36, -0.39],
    [-0.12, -0.15],
    [0.06, -0.57],
    [0.24, -0.51],
    [0.06, -0.09],
    [0.36, -0.09],
  ];
  arrow.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) arrow.lineTo(pts[i][0], pts[i][1]);
  arrow.lineTo(pts[0][0], pts[0][1]);

  const geo = new THREE.ExtrudeGeometry(arrow, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.center();
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, cursorMaterial()));
  return g;
}

/*
 * Recorder — the header sound toggle.
 *
 * A cassette read at header size: body plate, two reel hubs cut through it,
 * and a label strip across the middle. The reels are returned separately so
 * the component can spin them while audio is playing and leave them still when
 * it is not — the animation IS the state, the lettering just names it.
 */
export function buildRecorderIcon(uniforms: Uniforms): {
  group: THREE.Group;
  reels: THREE.Mesh[];
} {
  const group = new THREE.Group();

  // Two big windows rather than a cassette's full detail — at 60px in the
  // header, anything finer than this turns to mush.
  const body = roundRect(1.5, 0.95, 0.12);
  for (const x of [-0.34, 0.34]) {
    const hole = new THREE.Path();
    hole.absarc(x, 0.02, 0.26, 0, Math.PI * 2, false);
    body.holes.push(hole);
  }
  group.add(extrude(body, 0.18, uniforms));

  // One crossbar per reel. Two bars would read as a blur once spinning; one
  // wide bar stays countable at speed and still says "reel".
  const reels: THREE.Mesh[] = [];
  for (const x of [-0.34, 0.34]) {
    const bar = extrude(roundRect(0.4, 0.1, 0.04), 0.1, uniforms);
    bar.position.set(x, 0.02, 0.06);
    group.add(bar);
    reels.push(bar);
  }

  return { group, reels };
}

/*
 * Contact icon — an envelope.
 *
 * The design used a cursor dart, which is the same shape as the site's own
 * custom cursor and read as decoration rather than as "email me". Body plate
 * plus a V flap sitting proud of it.
 */
export function buildContactIcon(uniforms: Uniforms): THREE.Group {
  const g = new THREE.Group();

  const body = roundRect(1.12, 0.76, 0.09);
  g.add(extrude(body, 0.16, uniforms));

  const flap = new THREE.Shape();
  flap.moveTo(-0.56, 0.38);
  flap.lineTo(0, -0.06);
  flap.lineTo(0.56, 0.38);
  flap.lineTo(0.44, 0.38);
  flap.lineTo(0, 0.06);
  flap.lineTo(-0.44, 0.38);
  flap.lineTo(-0.56, 0.38);
  const flapMesh = extrude(flap, 0.1, uniforms);
  flapMesh.position.set(0, 0.04, 0.14);
  g.add(flapMesh);

  return g;
}

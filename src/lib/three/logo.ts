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

/* Design file lines 1064-1085 — verbatim. */
export function buildWorkIcon(uniforms: Uniforms): THREE.Group {
  const g = new THREE.Group();
  const body = roundRect(1.05, 0.74, 0.14);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.09, 0, Math.PI * 2, false);
  body.holes.push(hole);
  const m1 = extrude(body, 0.22, uniforms);
  g.add(m1);
  const handleOuter = roundRect(0.44, 0.3, 0.09);
  const hi = new THREE.Path();
  const w = 0.28,
    h = 0.3,
    r = 0.05;
  hi.moveTo(-w / 2 + r, -h / 2);
  hi.lineTo(w / 2 - r, -h / 2);
  hi.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  hi.lineTo(w / 2, h / 2);
  hi.lineTo(-w / 2, h / 2);
  hi.lineTo(-w / 2, -h / 2 + r);
  hi.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  handleOuter.holes.push(hi);
  const m2 = extrude(handleOuter, 0.16, uniforms);
  m2.position.set(0, 0.5, 0);
  g.add(m2);
  return g;
}

/* Design file lines 1087-1098 — verbatim. */
export function buildContactIcon(uniforms: Uniforms): THREE.Group {
  const g = new THREE.Group();
  const dart = new THREE.Shape();
  dart.moveTo(0, 0.62);
  dart.lineTo(0.6, -0.6);
  dart.lineTo(0, -0.22);
  dart.lineTo(-0.6, -0.6);
  dart.lineTo(0, 0.62);
  g.add(extrude(dart, 0.2, uniforms));
  return g;
}

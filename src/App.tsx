import { useEffect, useRef } from "react";
import { Application, Graphics } from "pixi.js";

const COLORS = {
  body: 0x4fc3f7, belly: 0xb3e5fc, eye: 0x1a237e,
  eyeWhite: 0xffffff, mouth: 0xe91e63, cheek: 0xf48fb1,
  ear: 0x29b6f6, earInner: 0xf48fb1,
};
const PX = 4;

function drawRect(g: Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.rect(x * PX, y * PX, w * PX, h * PX).fill({ color });
}

function drawPet(g: Graphics, frame: number) {
  g.clear();
  const b = Math.sin(frame * 0.05) * 1.5;
  const blink = frame % 120 < 4;

  drawRect(g, 7, 2, 3, 4, COLORS.ear);
  drawRect(g, 8, 3, 1, 2, COLORS.earInner);
  drawRect(g, 20, 2, 3, 4, COLORS.ear);
  drawRect(g, 21, 3, 1, 2, COLORS.earInner);
  drawRect(g, 6, 5+b, 18, 14, COLORS.body);
  drawRect(g, 8, 4+b, 14, 1, COLORS.body);
  if (blink) {
    drawRect(g, 10, 10+b, 4, 1, COLORS.eye);
    drawRect(g, 17, 10+b, 4, 1, COLORS.eye);
  } else {
    drawRect(g, 10, 9+b, 4, 4, COLORS.eyeWhite);
    drawRect(g, 17, 9+b, 4, 4, COLORS.eyeWhite);
    drawRect(g, 12, 10+b, 2, 2, COLORS.eye);
    drawRect(g, 19, 10+b, 2, 2, COLORS.eye);
  }
  drawRect(g, 7, 13+b, 2, 2, COLORS.cheek);
  drawRect(g, 22, 13+b, 2, 2, COLORS.cheek);
  drawRect(g, 14, 15+b, 3, 1, COLORS.mouth);
  drawRect(g, 13, 14+b, 1, 1, COLORS.mouth);
  drawRect(g, 17, 14+b, 1, 1, COLORS.mouth);
  drawRect(g, 8, 19+b, 14, 10, COLORS.body);
  drawRect(g, 10, 20+b, 10, 7, COLORS.belly);
  const a = Math.sin(frame * 0.08) * 1;
  drawRect(g, 5, 20+b+a, 3, 6, COLORS.body);
  drawRect(g, 4, 25+b+a, 3, 2, COLORS.body);
  drawRect(g, 22, 20+b-a, 3, 6, COLORS.body);
  drawRect(g, 23, 25+b-a, 3, 2, COLORS.body);
  drawRect(g, 9, 29+b, 5, 3, COLORS.body);
  drawRect(g, 8, 31+b, 6, 1, COLORS.ear);
  drawRect(g, 16, 29+b, 5, 3, COLORS.body);
  drawRect(g, 16, 31+b, 6, 1, COLORS.ear);
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let app: Application;
    let destroyed = false;

    (async () => {
      app = new Application();
      await app.init({
        width: 256, height: 256,
        backgroundAlpha: 0,
      });
      if (destroyed) return;
      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);

      const pet = new Graphics();
      pet.x = (256 - 30 * PX) / 2;
      pet.y = (256 - 32 * PX) / 2;
      app.stage.addChild(pet);

      let frame = 0;
      app.ticker.add(() => { frame++; drawPet(pet, frame); });

      // 整个窗口可拖拽
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        document.addEventListener("mousedown", (e) => {
          if (e.button === 0) win.startDragging().catch(() => {});
        });
      } catch {}
    })();

    return () => { destroyed = true; app?.destroy(true); };
  }, []);

  return <div ref={containerRef} style={{ width: 256, height: 256, cursor: "grab" }} />;
}

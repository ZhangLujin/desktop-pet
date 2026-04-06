import { useEffect, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";

// ============ 颜色与常量 ============
const COLORS = {
  body: 0x4fc3f7, belly: 0xb3e5fc, eye: 0x1a237e,
  eyeWhite: 0xffffff, mouth: 0xe91e63, cheek: 0xf48fb1,
  ear: 0x29b6f6, earInner: 0xf48fb1, highlight: 0xffeb3b,
};
const PX = 4;
const WIN_SIZE = 256;

// ============ 宠物状态 ============
type PetState = "idle" | "walking" | "happy";

interface PetContext {
  state: PetState;
  walkDir: 1 | -1;
  stateTimer: number;
  mouseX: number;
  mouseY: number;
  mouseInside: boolean;
}

// ============ 绘制 ============
function px(g: Graphics, x: number, y: number, w: number, h: number, color: number) {
  g.rect(x * PX, y * PX, w * PX, h * PX).fill({ color });
}

function drawPet(g: Graphics, frame: number, ctx: PetContext) {
  g.clear();
  const { state, stateTimer, mouseX, mouseY, mouseInside } = ctx;

  const breath = Math.sin(frame * 0.05) * 1.5;
  const blink = frame % 120 < 4;
  const jump = state === "happy" ? Math.abs(Math.sin(stateTimer * 0.15)) * -4 : 0;
  const walkBob = state === "walking" ? Math.sin(frame * 0.2) * 1 : 0;
  const b = breath + jump; // base Y offset

  // 耳朵
  px(g, 7, 2+b, 3, 4, COLORS.ear);
  px(g, 8, 3+b, 1, 2, COLORS.earInner);
  px(g, 20, 2+b, 3, 4, COLORS.ear);
  px(g, 21, 3+b, 1, 2, COLORS.earInner);

  // 头
  px(g, 6, 5+b+walkBob, 18, 14, COLORS.body);
  px(g, 8, 4+b+walkBob, 14, 1, COLORS.body);

  // 眼睛
  let pupilDx = 0, pupilDy = 0;
  if (mouseInside && state !== "happy") {
    // 鼠标相对于宠物中心的偏移 → 瞳孔偏移（-1 到 1）
    const cx = WIN_SIZE / 2, cy = WIN_SIZE / 2 - 20;
    pupilDx = Math.max(-1, Math.min(1, (mouseX - cx) / 50));
    pupilDy = Math.max(-1, Math.min(1, (mouseY - cy) / 50));
  }

  if (state === "happy") {
    // 眯眼笑
    px(g, 10, 10+b+walkBob, 4, 1, COLORS.eye);
    px(g, 11, 9+b+walkBob, 2, 1, COLORS.eye);
    px(g, 17, 10+b+walkBob, 4, 1, COLORS.eye);
    px(g, 18, 9+b+walkBob, 2, 1, COLORS.eye);
  } else if (blink) {
    px(g, 10, 10+b+walkBob, 4, 1, COLORS.eye);
    px(g, 17, 10+b+walkBob, 4, 1, COLORS.eye);
  } else {
    px(g, 10, 9+b+walkBob, 4, 4, COLORS.eyeWhite);
    px(g, 17, 9+b+walkBob, 4, 4, COLORS.eyeWhite);
    px(g, 12+pupilDx, 10+b+walkBob+pupilDy, 2, 2, COLORS.eye);
    px(g, 19+pupilDx, 10+b+walkBob+pupilDy, 2, 2, COLORS.eye);
  }

  // 脸颊
  const ck = state === "happy" ? COLORS.highlight : COLORS.cheek;
  px(g, 7, 13+b+walkBob, 2, 2, ck);
  px(g, 22, 13+b+walkBob, 2, 2, ck);

  // 嘴
  if (state === "happy") {
    px(g, 13, 15+b+walkBob, 5, 1, COLORS.mouth);
    px(g, 12, 14+b+walkBob, 1, 1, COLORS.mouth);
    px(g, 18, 14+b+walkBob, 1, 1, COLORS.mouth);
  } else {
    px(g, 14, 15+b+walkBob, 3, 1, COLORS.mouth);
    px(g, 13, 14+b+walkBob, 1, 1, COLORS.mouth);
    px(g, 17, 14+b+walkBob, 1, 1, COLORS.mouth);
  }

  // 身体
  px(g, 8, 19+b, 14, 10, COLORS.body);
  px(g, 10, 20+b, 10, 7, COLORS.belly);

  // 手臂
  const arm = state === "walking" ? Math.sin(frame * 0.2) * 2 : Math.sin(frame * 0.08) * 1;
  px(g, 5, 20+b+arm, 3, 6, COLORS.body);
  px(g, 4, 25+b+arm, 3, 2, COLORS.body);
  px(g, 22, 20+b-arm, 3, 6, COLORS.body);
  px(g, 23, 25+b-arm, 3, 2, COLORS.body);

  // 脚
  const leg = state === "walking" ? Math.sin(frame * 0.2) * 2 : 0;
  px(g, 9, 29+b+leg, 5, 3, COLORS.body);
  px(g, 8, 31+b+leg, 6, 1, COLORS.ear);
  px(g, 16, 29+b-leg, 5, 3, COLORS.body);
  px(g, 16, 31+b-leg, 6, 1, COLORS.ear);
}

// ============ 右键菜单 ============
function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", left: x, top: y, zIndex: 100,
        background: "rgba(30,30,30,0.95)", borderRadius: 8,
        padding: "4px 0", minWidth: 120, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      onMouseLeave={onClose}
    >
      {[
        { label: "关于", action: () => alert("桌面宠物 v0.1\nTauri + React + PixiJS") },
        { label: "退出", action: async () => {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          await getCurrentWindow().close();
        }},
      ].map((item, i) => (
        <div
          key={i}
          onClick={() => { item.action(); onClose(); }}
          style={{
            padding: "8px 16px", color: "#eee", fontSize: 13,
            fontFamily: "sans-serif", cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,195,247,0.3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ============ 主组件 ============
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<PetContext>({
    state: "idle", walkDir: 1, stateTimer: 0,
    mouseX: 0, mouseY: 0, mouseInside: false,
  });

  useEffect(() => {
    let app: Application;
    let destroyed = false;
    let win: any = null;
    let scaleFactor = 2; // 默认假设 200% DPI
    let screenW = 1920;  // 逻辑像素
    let screenH = 1080;

    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        win = getCurrentWindow();
        scaleFactor = await win.scaleFactor();
        const monitor = await win.currentMonitor();
        if (monitor) {
          // monitor.size 是物理像素，转成逻辑像素
          screenW = monitor.size.width / scaleFactor;
          screenH = monitor.size.height / scaleFactor;
        }
      } catch {}

      // 辅助：获取逻辑位置
      async function getLogicalPos() {
        if (!win) return { x: 0, y: 0 };
        const p = await win.outerPosition();
        return { x: p.x / scaleFactor, y: p.y / scaleFactor };
      }

      async function setLogicalPos(x: number, y: number) {
        if (!win) return;
        const { LogicalPosition } = await import("@tauri-apps/api/dpi");
        await win.setPosition(new LogicalPosition(x, y));
      }


      // PixiJS
      app = new Application();
      await app.init({ width: WIN_SIZE, height: WIN_SIZE, backgroundAlpha: 0 });
      if (destroyed) return;
      containerRef.current?.appendChild(app.canvas as HTMLCanvasElement);

      const pet = new Graphics();
      pet.x = (WIN_SIZE - 30 * PX) / 2;
      pet.y = (WIN_SIZE - 32 * PX) / 2;
      app.stage.addChild(pet);

      const ctx = ctxRef.current;
      let frame = 0;
      let idleFrames = 0;
      let walkSteps = 0;
      const WALK_SPEED = 1;

      app.ticker.add(async () => {
        frame++;
        ctx.stateTimer++;

        switch (ctx.state) {
          case "idle":
            idleFrames++;
            // 5秒后随机开始走
            if (idleFrames > 300 && Math.random() < 0.005) {
              ctx.state = "walking";
              ctx.stateTimer = 0;
              ctx.walkDir = Math.random() > 0.5 ? 1 : -1;
              walkSteps = 80 + Math.random() * 150;
              idleFrames = 0;
            }
            break;

          case "walking":
            walkSteps--;
            if (walkSteps <= 0) {
              ctx.state = "idle";
              ctx.stateTimer = 0;
              break;
            }
            try {
              const pos = await getLogicalPos();
              let nx = pos.x + WALK_SPEED * ctx.walkDir;
              const winLogical = WIN_SIZE / scaleFactor;
              // 边界检测：碰到边缘就转向
              if (nx <= 0) { nx = 0; ctx.walkDir = 1; }
              if (nx >= screenW - winLogical) { nx = screenW - winLogical; ctx.walkDir = -1; }
              await setLogicalPos(nx, pos.y);
            } catch {}
            break;

          case "happy":
            if (ctx.stateTimer > 60) {
              ctx.state = "idle";
              ctx.stateTimer = 0;
              idleFrames = 0;
            }
            break;
        }

        drawPet(pet, frame, ctx);
      });

      // 鼠标追踪
      document.addEventListener("mousemove", (e) => {
        ctx.mouseX = e.clientX;
        ctx.mouseY = e.clientY;
        ctx.mouseInside = true;
      });
      document.addEventListener("mouseleave", () => { ctx.mouseInside = false; });

      // 拖拽
      document.addEventListener("mousedown", async (e) => {
        if (e.button === 0) {
          try {
            if (win) await win.startDragging();
          } catch {}
        }
      });

      // 边缘吸附：拖拽结束后检查（startDragging 结束后窗口获得焦点）
      if (win) {
        const { listen } = await import("@tauri-apps/api/event");
        let snapTimeout: ReturnType<typeof setTimeout> | null = null;

        await listen("tauri://move", async () => {
          // 每次移动都重置计时器，停止移动 200ms 后执行吸附
          if (snapTimeout) clearTimeout(snapTimeout);
          snapTimeout = setTimeout(async () => {
            try {
              const pos = await getLogicalPos();
              const winLogical = WIN_SIZE / scaleFactor;
              const SNAP = 20;
              let { x, y } = pos;
              let snapped = false;

              if (x < SNAP) { x = 0; snapped = true; }
              if (y < SNAP) { y = 0; snapped = true; }
              if (x > screenW - winLogical - SNAP) { x = screenW - winLogical; snapped = true; }
              if (y > screenH - winLogical - SNAP) { y = screenH - winLogical; snapped = true; }

              if (snapped) {
                await setLogicalPos(x, y);
              }

              // 触发开心
              ctx.state = "happy";
              ctx.stateTimer = 0;
              idleFrames = 0;
            } catch {}
          }, 200);
        });
      }
    })();

    return () => { destroyed = true; app?.destroy(true); };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: WIN_SIZE, height: WIN_SIZE, cursor: "grab" }}
      onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
    >
      {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}

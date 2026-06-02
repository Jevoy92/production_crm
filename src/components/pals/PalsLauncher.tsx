import { useState, lazy, Suspense } from "react";
import palsAvatar from "@/assets/pals-avatar.png";

const PalsDrawer = lazy(() => import("./PalsDrawer").then((m) => ({ default: m.PalsDrawer })));

/** Floating bottom-right launcher visible on every page. */
export function PalsLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close Pals" : "Open Pals"}
        onClick={() => setOpen((o) => !o)}
        className="pals-launcher"
      >
        <img
          src={palsAvatar}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          style={{ display: "block", borderRadius: 8 }}
        />
      </button>
      {open && (
        <Suspense fallback={null}>
          <PalsDrawer onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
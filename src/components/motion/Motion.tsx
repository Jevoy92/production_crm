import * as React from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { fadeUp, scaleIn, staggerContainer, EASE } from "@/lib/motion";

/**
 * Reveal — animates its children into view once (on scroll/mount).
 * Falls back to a static render when the user prefers reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "fadeUp",
  once = true,
  className,
  style,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: "fadeUp" | "scaleIn";
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof typeof motion;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduce = useReducedMotion();
  const variants = variant === "scaleIn" ? scaleIn : fadeUp;
  const MotionTag = (motion as any)[as] ?? motion.div;

  if (reduce) {
    const Tag = as as any;
    return (
      <Tag ref={ref} className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Stagger — a container whose direct <StaggerItem> children animate in sequence.
 */
export function Stagger({
  children,
  stagger = 0.06,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
  variant = "fadeUp",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "fadeUp" | "scaleIn";
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={variant === "scaleIn" ? scaleIn : fadeUp}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * AnimatedNumber — counts up to `value` when it scrolls into view.
 * Honors reduced-motion by rendering the final value immediately.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const [display, setDisplay] = React.useState(() => format(reduce ? value : 0));

  React.useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    if (inView) mv.set(value);
  }, [inView, value, reduce, mv, format]);

  React.useEffect(() => {
    if (reduce) return;
    const unsub = spring.on("change", (v) => setDisplay(format(v)));
    return () => unsub();
  }, [spring, format, reduce]);

  // duration is conveyed via spring config; param kept for call-site clarity
  void duration;

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/**
 * HoverLift — wraps interactive content so it lifts/scales subtly on hover.
 */
export function HoverLift({
  children,
  className,
  style,
  lift = -3,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  lift?: number;
} & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={reduce ? undefined : { y: lift }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.2, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

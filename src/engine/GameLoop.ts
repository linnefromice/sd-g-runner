import { useCallback, useEffect, useRef } from "react";

export type TimeInfo = {
  delta: number; // ms since last frame
  elapsed: number; // ms since start
  timestamp: number; // absolute timestamp
};

export type SystemArgs = {
  time: TimeInfo;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Entities = {};

export type GameSystem<E extends Entities = Entities> = (
  entities: E,
  args: SystemArgs
) => void;

export function useGameLoop<E extends Entities>(
  systemsRef: React.RefObject<GameSystem<E>[]>,
  entitiesRef: React.RefObject<E>,
  running: boolean
): void {
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);

  const tick = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        prevTimeRef.current = timestamp;
      }

      const delta = timestamp - prevTimeRef.current;
      prevTimeRef.current = timestamp;

      const time: TimeInfo = {
        delta,
        elapsed: timestamp - startTimeRef.current,
        timestamp,
      };

      const systems = systemsRef.current;
      const entities = entitiesRef.current;
      if (systems && entities) {
        for (let i = 0; i < systems.length; i++) {
          systems[i](entities, { time });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [systemsRef, entitiesRef]
  );

  useEffect(() => {
    if (running) {
      startTimeRef.current = 0;
      prevTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [running, tick]);
}

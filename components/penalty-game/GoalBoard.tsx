"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface GoalBoardProps {
  selectedPosition: number | null;
  onSelectPosition: (position: number) => void;
  onDive?: () => void;
  canDive?: boolean;
  ballPosition?: number;
  isRevealing?: boolean;
  disabled?: boolean;
  statusText?: string;
  rightPanelExtra?: React.ReactNode;
}

// Positions: 0=top-left, 1=top-right, 2=center, 3=bottom-left, 4=bottom-right
const POSITION_LABELS = ["Top Left", "Top Right", "Center", "Bottom Left", "Bottom Right"];

// Goalkeeper dive transforms for each position
const KEEPER_DIVES: Record<number, { transform: string; pose: "dive-high" | "dive-low" | "stand" }> = {
  0: { transform: "translateX(-90px) translateY(-40px) rotate(-25deg)", pose: "dive-high" },
  1: { transform: "translateX(90px) translateY(-40px) rotate(25deg)", pose: "dive-high" },
  2: { transform: "translateY(5px)", pose: "stand" },
  3: { transform: "translateX(-90px) translateY(20px) rotate(-15deg)", pose: "dive-low" },
  4: { transform: "translateX(90px) translateY(20px) rotate(15deg)", pose: "dive-low" },
};

// Pixel art goalkeeper component - larger version
function PixelGoalkeeper({ pose, flip }: { pose: "stand" | "dive-high" | "dive-low"; flip?: boolean }) {
  const isStanding = pose === "stand";
  const isDiveHigh = pose === "dive-high";

  return (
    <div
      className="relative"
      style={{
        transform: flip ? "scaleX(-1)" : "scaleX(1)",
        imageRendering: "pixelated",
      }}
    >
      <svg
        width="96"
        height="120"
        viewBox="0 0 32 40"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Head */}
        <rect x="12" y="2" width="8" height="8" fill="#FFD5B5" />
        {/* Hair */}
        <rect x="12" y="1" width="8" height="3" fill="#4A3728" />
        <rect x="11" y="2" width="1" height="2" fill="#4A3728" />
        <rect x="20" y="2" width="1" height="2" fill="#4A3728" />
        {/* Eyes */}
        <rect x="13" y="5" width="2" height="2" fill="#222" />
        <rect x="17" y="5" width="2" height="2" fill="#222" />

        {/* Jersey - cyan/teal like Captain Tsubasa goalkeepers */}
        <rect x="10" y="10" width="12" height="12" fill="#00B5AD" />
        {/* Jersey stripe */}
        <rect x="10" y="13" width="12" height="2" fill="#009688" />
        <rect x="10" y="17" width="12" height="2" fill="#009688" />
        {/* Jersey number "1" */}
        <rect x="15" y="11" width="2" height="6" fill="#FFF" />

        {/* Arms based on pose */}
        {isStanding ? (
          <>
            <rect x="6" y="11" width="4" height="3" fill="#00B5AD" />
            <rect x="22" y="11" width="4" height="3" fill="#00B5AD" />
            <rect x="5" y="14" width="4" height="4" fill="#FF6B00" />
            <rect x="23" y="14" width="4" height="4" fill="#FF6B00" />
          </>
        ) : isDiveHigh ? (
          <>
            <rect x="4" y="6" width="4" height="8" fill="#00B5AD" />
            <rect x="24" y="6" width="4" height="8" fill="#00B5AD" />
            <rect x="2" y="2" width="5" height="5" fill="#FF6B00" />
            <rect x="25" y="2" width="5" height="5" fill="#FF6B00" />
          </>
        ) : (
          <>
            <rect x="2" y="12" width="8" height="3" fill="#00B5AD" />
            <rect x="22" y="12" width="8" height="3" fill="#00B5AD" />
            <rect x="0" y="11" width="4" height="5" fill="#FF6B00" />
            <rect x="28" y="11" width="4" height="5" fill="#FF6B00" />
          </>
        )}

        {/* Shorts */}
        <rect x="10" y="22" width="12" height="6" fill="#1A1A2E" />

        {/* Legs */}
        <rect x="11" y="28" width="4" height="8" fill="#FFD5B5" />
        <rect x="17" y="28" width="4" height="8" fill="#FFD5B5" />

        {/* Socks */}
        <rect x="10" y="32" width="5" height="4" fill="#00B5AD" />
        <rect x="17" y="32" width="5" height="4" fill="#00B5AD" />

        {/* Boots */}
        <rect x="9" y="36" width="6" height="4" fill="#1A1A2E" />
        <rect x="17" y="36" width="6" height="4" fill="#1A1A2E" />
      </svg>
    </div>
  );
}

// Pixel art soccer ball component
function PixelBall({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="4" y="1" width="8" height="1" fill="#FFF" />
      <rect x="2" y="2" width="12" height="1" fill="#FFF" />
      <rect x="1" y="3" width="14" height="1" fill="#FFF" />
      <rect x="1" y="4" width="14" height="8" fill="#FFF" />
      <rect x="1" y="12" width="14" height="1" fill="#FFF" />
      <rect x="2" y="13" width="12" height="1" fill="#FFF" />
      <rect x="4" y="14" width="8" height="1" fill="#FFF" />

      <rect x="6" y="5" width="4" height="4" fill="#1A1A2E" />
      <rect x="7" y="4" width="2" height="1" fill="#1A1A2E" />
      <rect x="7" y="9" width="2" height="1" fill="#1A1A2E" />
      <rect x="5" y="6" width="1" height="2" fill="#1A1A2E" />
      <rect x="10" y="6" width="1" height="2" fill="#1A1A2E" />

      <rect x="2" y="3" width="2" height="2" fill="#1A1A2E" />
      <rect x="12" y="3" width="2" height="2" fill="#1A1A2E" />
      <rect x="2" y="11" width="2" height="2" fill="#1A1A2E" />
      <rect x="12" y="11" width="2" height="2" fill="#1A1A2E" />

      <rect x="3" y="4" width="2" height="1" fill="#E8E8E8" />
      <rect x="3" y="5" width="1" height="1" fill="#E8E8E8" />

      <rect x="4" y="14" width="8" height="1" fill="#CCC" />
      <rect x="13" y="5" width="1" height="7" fill="#CCC" />
    </svg>
  );
}

// Ball end positions in the goal (percentage-based)
const BALL_POSITIONS: Record<number, { left: string; top: string }> = {
  0: { left: "20%", top: "25%" },
  1: { left: "80%", top: "25%" },
  2: { left: "50%", top: "50%" },
  3: { left: "20%", top: "70%" },
  4: { left: "80%", top: "70%" },
};

// Target zone positions for clicking (overlaid on goal)
const TARGET_ZONES = [
  { id: 0, style: { left: "5%", top: "5%", width: "30%", height: "40%" } },
  { id: 1, style: { left: "65%", top: "5%", width: "30%", height: "40%" } },
  { id: 2, style: { left: "25%", top: "25%", width: "50%", height: "50%" } },
  { id: 3, style: { left: "5%", top: "55%", width: "30%", height: "40%" } },
  { id: 4, style: { left: "65%", top: "55%", width: "30%", height: "40%" } },
];

export function GoalBoard({
  selectedPosition,
  onSelectPosition,
  onDive,
  canDive,
  ballPosition,
  isRevealing,
  disabled,
  statusText,
  rightPanelExtra,
}: GoalBoardProps) {
  const [animationPhase, setAnimationPhase] = useState<"idle" | "kick" | "flying" | "result">("idle");
  const [ballScale, setBallScale] = useState(0.3);

  useEffect(() => {
    if (isRevealing && ballPosition !== undefined) {
      setAnimationPhase("kick");
      setBallScale(0.3);

      setTimeout(() => {
        setAnimationPhase("flying");
        setBallScale(1);
      }, 200);

      setTimeout(() => setAnimationPhase("result"), 1000);
    } else if (!isRevealing) {
      setAnimationPhase("idle");
      setBallScale(0.3);
    }
  }, [isRevealing, ballPosition]);

  const saved = selectedPosition === ballPosition;
  const showResult = animationPhase === "result";

  return (
    <div className="flex gap-6 select-none">
      {/* Main game view - 2x larger */}
      <div
        className="relative w-[640px] h-[480px] overflow-hidden rounded-lg border-4 border-gray-900 flex-shrink-0"
        style={{
          imageRendering: "pixelated",
        }}
      >
        {/* Sky background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #5090d0 0%, #70a8e8 50%, #90c0f8 100%)",
          }}
        />

        {/* Clouds */}
        <div className="absolute top-4 left-[10%] w-24 h-8 bg-white rounded-full opacity-80" />
        <div className="absolute top-6 left-[25%] w-32 h-7 bg-white rounded-full opacity-70" />
        <div className="absolute top-2 right-[15%] w-20 h-7 bg-white rounded-full opacity-80" />
        <div className="absolute top-5 right-[35%] w-16 h-6 bg-white rounded-full opacity-60" />

        {/* Stadium crowd (pixelated blocks) */}
        <div className="absolute top-[12%] inset-x-0 h-[25%] flex items-end justify-center">
          <div
            className="w-full h-full"
            style={{
              background: `
                repeating-linear-gradient(
                  90deg,
                  #d03030 0px, #d03030 6px,
                  #3030d0 6px, #3030d0 12px,
                  #f0f030 12px, #f0f030 18px,
                  #30d030 18px, #30d030 24px,
                  #f08030 24px, #f08030 30px
                )
              `,
              imageRendering: "pixelated",
            }}
          />
        </div>

        {/* Stadium structure lines */}
        <div className="absolute top-[10%] inset-x-0 h-3 bg-gray-700" />
        <div className="absolute top-[36%] inset-x-0 h-2 bg-gray-600" />

        {/* Field */}
        <div
          className="absolute bottom-0 inset-x-0 h-[45%]"
          style={{
            background: "linear-gradient(180deg, #208020 0%, #30a030 30%, #40b040 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(90deg, transparent 49.5%, #60d060 49.5%, #60d060 50.5%, transparent 50.5%)
              `,
            }}
          />
          <div className="absolute top-0 left-[15%] right-[15%] h-[3px] bg-white/40" />
        </div>

        {/* Idle ball on field with bounce animation */}
        {!isRevealing && (
          <div
            className="absolute z-40 animate-bounce-ball"
            style={{
              left: "50%",
              bottom: "8%",
              transform: "translateX(-50%)",
            }}
          >
            <img
              src="/sprites/ball.png"
              alt="Soccer ball"
              width={64}
              height={64}
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        )}

        {/* Goal frame and net container */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 w-[70%] h-[52%]">
          {/* Goal net - diamond pattern */}
          <div
            className="absolute inset-[3%] z-0"
            style={{
              background: `
                repeating-linear-gradient(
                  45deg,
                  transparent 0px,
                  transparent 8px,
                  rgba(255,255,255,0.5) 8px,
                  rgba(255,255,255,0.5) 10px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent 0px,
                  transparent 8px,
                  rgba(255,255,255,0.5) 8px,
                  rgba(255,255,255,0.5) 10px
                )
              `,
              backgroundColor: "rgba(0,0,0,0.15)",
            }}
          />

          {/* Goal posts */}
          <div className="absolute left-0 top-0 bottom-0 w-[4%] bg-white z-10"
            style={{ boxShadow: "3px 0 6px rgba(0,0,0,0.3)" }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[4%] bg-white z-10"
            style={{ boxShadow: "-3px 0 6px rgba(0,0,0,0.3)" }}
          />
          <div className="absolute left-0 right-0 top-0 h-[5%] bg-white z-10"
            style={{ boxShadow: "0 3px 6px rgba(0,0,0,0.3)" }}
          />

          {/* Target zones (clickable areas) */}
          {TARGET_ZONES.map((zone) => {
            const isSelected = selectedPosition === zone.id;
            const isBallHere = showResult && ballPosition === zone.id;
            const isSaved = isBallHere && saved;

            return (
              <button
                key={zone.id}
                onClick={() => !disabled && onSelectPosition(zone.id)}
                disabled={disabled}
                className={cn(
                  "absolute transition-all duration-200 rounded z-20",
                  !disabled && "hover:bg-yellow-400/40 hover:ring-2 hover:ring-yellow-400",
                  isSelected && !isRevealing && "bg-yellow-400/50 ring-2 ring-yellow-400 animate-pulse",
                  !isSelected && "bg-transparent",
                  isBallHere && !isSaved && "bg-red-500/50 ring-2 ring-red-500",
                  isSaved && "bg-green-500/50 ring-2 ring-green-500",
                  disabled && "cursor-default"
                )}
                style={zone.style}
              />
            );
          })}

          {/* Goalkeeper */}
          <div
            className={cn(
              "absolute bottom-[5%] left-1/2 z-30 transition-all ease-out",
              animationPhase !== "idle" ? "duration-300" : "duration-500"
            )}
            style={{
              transform: `translateX(-50%) ${
                isRevealing && selectedPosition !== null
                  ? KEEPER_DIVES[selectedPosition].transform
                  : ""
              }`,
            }}
          >
            <PixelGoalkeeper
              pose={
                isRevealing && selectedPosition !== null
                  ? KEEPER_DIVES[selectedPosition].pose
                  : "stand"
              }
              flip={isRevealing && selectedPosition !== null && (selectedPosition === 0 || selectedPosition === 3)}
            />
          </div>

          {/* Soccer Ball - flying into goal */}
          {isRevealing && ballPosition !== undefined && (
            <div
              className={cn(
                "absolute z-40 transition-all",
                animationPhase === "kick" && "opacity-70",
                animationPhase === "flying" && "opacity-100",
                animationPhase === "result" && "opacity-100",
              )}
              style={{
                left: animationPhase === "kick" ? "50%" : BALL_POSITIONS[ballPosition].left,
                top: animationPhase === "kick" ? "120%" : BALL_POSITIONS[ballPosition].top,
                transform: `translate(-50%, -50%) scale(${ballScale})`,
                transitionDuration: animationPhase === "flying" ? "800ms" : "200ms",
                transitionTimingFunction: "ease-out",
              }}
            >
              <img
                src="/sprites/ball.png"
                alt="Soccer ball"
                width={72}
                height={72}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
        </div>

        {/* Result overlay */}
        {showResult && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div
              className={cn(
                "px-12 py-6 text-4xl font-bold tracking-wider animate-bounce",
                "border-4 shadow-2xl",
                saved
                  ? "bg-blue-600 text-white border-blue-300"
                  : "bg-red-600 text-white border-red-300"
              )}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                textShadow: "4px 4px 0 rgba(0,0,0,0.5)",
                imageRendering: "pixelated",
              }}
            >
              {saved ? "SAVED!!" : "GOAL!!"}
            </div>
          </div>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex flex-col gap-4 w-48">
        {/* Status text */}
        <div className="text-center text-gray-400 text-sm h-6">
          {statusText || (
            selectedPosition !== null
              ? `Selected: ${POSITION_LABELS[selectedPosition]}`
              : "Choose position"
          )}
        </div>

        {/* Corner selector - visual layout matching goal */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 text-center mb-3">SELECT POSITION</div>
          <div className="grid grid-cols-3 gap-2">
            {/* Top row */}
            <button
              onClick={() => !disabled && onSelectPosition(0)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                selectedPosition === 0
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              ↖
            </button>
            <div /> {/* Empty center-top */}
            <button
              onClick={() => !disabled && onSelectPosition(1)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                selectedPosition === 1
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              ↗
            </button>

            {/* Middle row */}
            <div /> {/* Empty left-middle */}
            <button
              onClick={() => !disabled && onSelectPosition(2)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                selectedPosition === 2
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              ●
            </button>
            <div /> {/* Empty right-middle */}

            {/* Bottom row */}
            <button
              onClick={() => !disabled && onSelectPosition(3)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                selectedPosition === 3
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              ↙
            </button>
            <div /> {/* Empty center-bottom */}
            <button
              onClick={() => !disabled && onSelectPosition(4)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                selectedPosition === 4
                  ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              ↘
            </button>
          </div>
        </div>

        {/* Extra content (e.g., bet selector) */}
        {rightPanelExtra}

        {/* Dive button */}
        {onDive && (
          <button
            onClick={onDive}
            disabled={!canDive}
            className={cn(
              "w-full py-4 rounded-lg font-bold text-xl transition-all",
              canDive
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            🧤 DIVE!
          </button>
        )}

        {/* Position labels */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>↖ Top Left</span>
            <span>↗ Top Right</span>
          </div>
          <div className="text-center">● Center</div>
          <div className="flex justify-between">
            <span>↙ Bot Left</span>
            <span>↘ Bot Right</span>
          </div>
        </div>
      </div>
    </div>
  );
}

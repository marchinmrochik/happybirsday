export type EyeStyle = "wide" | "focused" | "sleepy";
export type BrowStyle = "soft" | "raised" | "serious";
export type HairStyle = "bun" | "shortTop" | "cap";

export type CharacterCustomization = {
  shirtColor: string;
  shortsColor: string;
  capColor: string;
  capEnabled: boolean;
  eyeStyle: EyeStyle;
  browStyle: BrowStyle;
  hairStyle: HairStyle;
};

export const defaultCharacterCustomization: CharacterCustomization = {
  shirtColor: "#f8f2e4",
  shortsColor: "#06080a",
  capColor: "#111111",
  capEnabled: false,
  eyeStyle: "wide",
  browStyle: "soft",
  hairStyle: "bun"
};

export const customizationOptions = {
  shirtColors: [
    { label: "White", value: "#f8f2e4" },
    { label: "Black", value: "#111111" },
    { label: "Acid", value: "#9dff22" },
    { label: "Cyan", value: "#28f0d2" },
    { label: "Violet", value: "#8b4dff" }
  ],
  shortsColors: [
    { label: "Black", value: "#06080a" },
    { label: "Navy", value: "#101a36" },
    { label: "Graphite", value: "#2c3138" },
    { label: "Green", value: "#234d23" }
  ],
  capColors: [
    { label: "Black", value: "#111111" },
    { label: "Red", value: "#d92323" },
    { label: "Cyan", value: "#28f0d2" },
    { label: "Cream", value: "#f8f2e4" }
  ],
  eyes: [
    { label: "Wide", value: "wide" },
    { label: "Focused", value: "focused" },
    { label: "Sleepy", value: "sleepy" }
  ] satisfies Array<{ label: string; value: EyeStyle }>,
  brows: [
    { label: "Soft", value: "soft" },
    { label: "Raised", value: "raised" },
    { label: "Serious", value: "serious" }
  ] satisfies Array<{ label: string; value: BrowStyle }>,
  hair: [
    { label: "Bun", value: "bun" },
    { label: "Short top", value: "shortTop" },
    { label: "Cap", value: "cap" }
  ] satisfies Array<{ label: string; value: HairStyle }>
};

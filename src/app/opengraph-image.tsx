import { ImageResponse } from "next/og";

export const alt = "Breeders — motion components, ready to copy.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0A0A0B",
        }}
      >
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#FFFFFF" }}>
          Motion components, ready to copy.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#8B8B93" }}>
          Breeders — copy the prompt, take the code, or edit and export.
        </div>
      </div>
    ),
    size,
  );
}

import type { DOMAttributes, Ref } from "react";

type ModelViewerProps = DOMAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement | null>;
  className?: string;
  src?: string;
  alt?: string;
  poster?: string;
  exposure?: string;
  "shadow-intensity"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "interaction-prompt"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

export {};

// Batch "ui-a": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import agentSteps from "../items/agent-steps";
import liquidToggle from "../items/liquid-toggle";
import promptComposer from "../items/prompt-composer";
import checkoutMorph from "../items/checkout-morph";
import chatThread from "../items/chat-thread";
import progressRing from "../items/progress-ring";

export const batch: AnyMotionDef[] = [agentSteps, liquidToggle, promptComposer, checkoutMorph, chatThread, progressRing];

// Batch "v3-b": premium interaction components (see docs/BUILDING-COMPONENTS.md). Owned by one builder.
import type { AnyMotionDef } from "../types";
import avatarStackFan from "../items/avatar-stack-fan";
import memberSelector from "../items/member-selector";
import voiceChatPill from "../items/voice-chat-pill";
import presenceAvatars from "../items/presence-avatars";

export const batch: AnyMotionDef[] = [avatarStackFan, memberSelector, voiceChatPill, presenceAvatars];

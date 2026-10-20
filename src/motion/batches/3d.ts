// Batch "3d": one import per component folder in src/motion/items/. Owned by one builder; append only.
import type { AnyMotionDef } from "../types";
import glassTorus from "../items/glass-torus";
import floatingCubes from "../items/floating-cubes";
import particleSphere from "../items/particle-sphere";
import wavePlane from "../items/wave-plane";
import tiltCard3d from "../items/tilt-card-3d";
import isometricStack from "../items/isometric-stack";
import orbitIcons from "../items/orbit-icons";

export const batch: AnyMotionDef[] = [glassTorus, floatingCubes, particleSphere, wavePlane, tiltCard3d, isometricStack, orbitIcons];

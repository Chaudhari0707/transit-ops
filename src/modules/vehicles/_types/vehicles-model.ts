import { type UnwrapSchema } from "elysia";

import type { VehiclesModel as VehiclesModelValue } from "@/modules/vehicles/model";

export type VehiclesModel = {
  [K in keyof typeof VehiclesModelValue]: UnwrapSchema<(typeof VehiclesModelValue)[K]>;
};

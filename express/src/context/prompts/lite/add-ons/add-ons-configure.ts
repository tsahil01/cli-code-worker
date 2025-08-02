import { planSchema } from "../../../../types";
import { z } from "zod";
import { MEMORY_ADDON } from "./memory";
import { GITHUB_ADDON } from "./github";
import { ADVANCED_CONTEXT_ADDON } from "./advanced-context";

export const addOnesConfig = (plan: z.infer<typeof planSchema>) => {
    let addOns = '';

    if (plan.addOns) {
        plan.addOns.forEach((addOn) => {
            if (addOn === "memory") {
                addOns += MEMORY_ADDON;
            } else if (addOn === "github") {
                addOns += GITHUB_ADDON;
            } else if (addOn === "advanced-context") {
                addOns += ADVANCED_CONTEXT_ADDON;
            }
        })
    }

    return addOns;
}
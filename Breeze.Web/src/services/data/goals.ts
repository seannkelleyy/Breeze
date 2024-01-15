/**
 * Currently this is a static list of goals. In the future, this will be a list of goals that are stored in a database.
 */

import { Goal } from "../../models/goal";

export const goals: Goal[]= [
    {
        id: 1,
        goal: "Pay Off House",
    },
    {
        id: 2,
        goal: "Save 15% of income for retirement",
    },
    {
        id: 3,
        goal: "Save $5,000 for vacation in Italy",
    }
        
]
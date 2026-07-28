import { z } from "zod";

// Google Ads GAQL validation helpers — prevent GAQL injection via AI-agent parameters.
// Every value a GaqlBuilder predicate accepts is parsed against one of these schemas
// and throws on mismatch; the builder never exposes a way to interpolate an
// unvalidated value into query text.
export const gaqlNumericId = z.string().regex(/^\d+$/, "Must be a numeric Google Ads ID");
export const gaqlDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");
export const gaqlDatePreset = z.enum([
    "TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_14_DAYS", "LAST_30_DAYS", "LAST_90_DAYS",
    "LAST_BUSINESS_WEEK", "THIS_WEEK_SUN_TODAY", "THIS_WEEK_MON_TODAY",
    "LAST_WEEK_SUN_SAT", "LAST_WEEK_MON_SUN", "THIS_MONTH", "LAST_MONTH", "ALL_TIME",
]);
export const gaqlCampaignStatus = z.enum(["ENABLED", "PAUSED", "REMOVED"]);
export const gaqlAdGroupStatus = z.enum(["ENABLED", "PAUSED", "REMOVED"]);
export const gaqlAdStatus = z.enum(["ENABLED", "PAUSED", "DISABLED", "REMOVED"]);
export const gaqlEnum = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Must be a valid Google Ads enum value");

const GAQL_MIN_LIMIT = 1;
const GAQL_MAX_LIMIT = 10000;

function buildDateCondition(params: Record<string, unknown>): string {
    if (params.dateRangeStart && params.dateRangeEnd) {
        const start = gaqlDate.parse(params.dateRangeStart);
        const end = gaqlDate.parse(params.dateRangeEnd);
        return `segments.date BETWEEN '${start}' AND '${end}'`;
    }
    if (params.datePreset) {
        return `segments.date DURING ${gaqlDatePreset.parse(params.datePreset)}`;
    }
    return "segments.date DURING LAST_30_DAYS";
}

export class GaqlBuilder {
    private conditions: string[] = [];
    private orderClause?: string;
    private limitClause?: number;

    constructor(private readonly fields: string[], private readonly resource: string) { }

    /** Appends a fixed, param-free literal condition (e.g. a hardcoded type filter). */
    where(condition: string | false | null | undefined) {
        if (condition)
            this.conditions.push(condition);
        return this;
    }

    /** `field = <numeric id>` — value is validated, skipped when absent. */
    eqId(field: string, value: unknown) {
        if (value === undefined || value === null)
            return this;
        return this.where(`${field} = ${gaqlNumericId.parse(value)}`);
    }

    /** `field = '<enum-shaped value>'` — value is validated, skipped when absent. */
    eqEnum(field: string, value: unknown) {
        if (value === undefined || value === null)
            return this;
        return this.where(`${field} = '${gaqlEnum.parse(value)}'`);
    }

    /** `field LIKE '%<numeric id>%'` — value is validated, skipped when absent. */
    containsId(field: string, value: unknown) {
        if (value === undefined || value === null)
            return this;
        return this.where(`${field} LIKE '%${gaqlNumericId.parse(value)}%'`);
    }

    /** `field = '<template with {id} replaced by a validated numeric id>'`. */
    resourceEq(field: string, template: string, id: unknown) {
        if (id === undefined || id === null)
            return this;
        return this.where(`${field} = '${template.replace("{id}", gaqlNumericId.parse(id))}'`);
    }

    /** `field >= '<date>' AND field <= '<date>'` — both values validated, skipped unless both are present. */
    betweenDates(field: string, start: unknown, end: unknown) {
        if (!start || !end)
            return this;
        return this.where(`${field} >= '${gaqlDate.parse(start)}' AND ${field} <= '${gaqlDate.parse(end)}'`);
    }

    dateRange(params: Record<string, unknown>) {
        return this.where(buildDateCondition(params));
    }

    orderBy(orderClause: string) {
        this.orderClause = orderClause;
        return this;
    }

    limit(limit: unknown, fallback: number) {
        const raw = typeof limit === "number" && Number.isFinite(limit) ? Math.trunc(limit) : fallback;
        this.limitClause = Math.min(Math.max(raw, GAQL_MIN_LIMIT), GAQL_MAX_LIMIT);
        return this;
    }

    toString() {
        const parts = [`SELECT ${this.fields.join(", ")} FROM ${this.resource}`];
        if (this.conditions.length > 0) {
            parts.push(`WHERE ${this.conditions.join(" AND ")}`);
        }
        if (this.orderClause) {
            parts.push(`ORDER BY ${this.orderClause}`);
        }
        if (this.limitClause !== undefined) {
            parts.push(`LIMIT ${this.limitClause}`);
        }
        return parts.join(" ");
    }
}

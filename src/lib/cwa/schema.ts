import { z } from "zod";

// Flexible parameter / elementValue parser for both F-C0032 and F-A0010 / F-D0047 formats
export const CWAElementValueSchema = z.object({
  parameterName: z.string().optional(),
  parameterValue: z.string().optional(),
  parameterUnit: z.string().optional(),
  value: z.string().optional(),
  measures: z.string().optional(),
}).passthrough();

export const CWATimeSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dataTime: z.string().optional(),
  parameter: CWAElementValueSchema.optional(),
  elementValue: z.array(CWAElementValueSchema).optional(),
}).passthrough();

export const CWAElementSchema = z.object({
  elementName: z.string(),
  description: z.string().optional(),
  time: z.array(CWATimeSchema).optional().default([]),
}).passthrough();

export const CWALocationSchema = z.object({
  locationName: z.string(),
  geocode: z.string().optional(),
  lat: z.union([z.string(), z.number()]).optional(),
  lon: z.union([z.string(), z.number()]).optional(),
  weatherElement: z.array(CWAElementSchema).optional().default([]),
}).passthrough();

export const CWALocationsWrapperSchema = z.object({
  datasetDescription: z.string().optional(),
  locationsName: z.string().optional(),
  dataid: z.string().optional(),
  location: z.array(CWALocationSchema).optional().default([]),
}).passthrough();

export const CWARecordsSchema = z.object({
  datasetDescription: z.string().optional(),
  location: z.array(CWALocationSchema).optional(),
  locations: z.union([
    z.array(CWALocationsWrapperSchema),
    CWALocationsWrapperSchema,
  ]).optional(),
}).passthrough();

export const CWAResponseSchema = z.object({
  success: z.union([z.string(), z.boolean()]).optional(),
  result: z.any().optional(),
  records: CWARecordsSchema,
}).passthrough();

export type CWAResponse = z.infer<typeof CWAResponseSchema>;
export type CWALocation = z.infer<typeof CWALocationSchema>;
export type CWAElement = z.infer<typeof CWAElementSchema>;
export type CWATime = z.infer<typeof CWATimeSchema>;

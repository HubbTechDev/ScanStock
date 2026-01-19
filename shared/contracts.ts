// contracts.ts
// Shared API contracts (schemas and types) used by both the server and the app.
// Import in the app as: `import { type GetSampleResponse } from "@shared/contracts"`
// Import in the server as: `import { postSampleRequestSchema } from "@shared/contracts"`

import { z } from "zod";

// GET /api/sample
export const getSampleResponseSchema = z.object({
  message: z.string(),
});
export type GetSampleResponse = z.infer<typeof getSampleResponseSchema>;

// POST /api/sample
export const postSampleRequestSchema = z.object({
  value: z.string(),
});
export type PostSampleRequest = z.infer<typeof postSampleRequestSchema>;
export const postSampleResponseSchema = z.object({
  message: z.string(),
});
export type PostSampleResponse = z.infer<typeof postSampleResponseSchema>;

// POST /api/upload/image
export const uploadImageRequestSchema = z.object({
  image: z.instanceof(File),
});
export type UploadImageRequest = z.infer<typeof uploadImageRequestSchema>;
export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
  filename: z.string(),
});
export type UploadImageResponse = z.infer<typeof uploadImageResponseSchema>;

// ============================================
// Inventory Item Types
// ============================================

export const inventoryStatusSchema = z.enum(["pending", "completed", "sold"]);
export type InventoryStatus = z.infer<typeof inventoryStatusSchema>;

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string(),
  binNumber: z.string(),
  rackNumber: z.string(),
  platform: z.string(),
  status: inventoryStatusSchema,
  soldAt: z.string().nullable(),
  soldPrice: z.number().nullable(),
  shipByDate: z.string().nullable(),
  shipperQrCode: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// GET /api/inventory - Get all inventory items
export const getInventoryResponseSchema = z.object({
  items: z.array(inventoryItemSchema),
  stats: z.object({
    total: z.number(),
    pending: z.number(),
    completed: z.number(),
    sold: z.number(),
  }),
});
export type GetInventoryResponse = z.infer<typeof getInventoryResponseSchema>;

// GET /api/inventory/:id - Get single inventory item
export type GetInventoryItemResponse = InventoryItem;

// POST /api/inventory - Create inventory item
export const createInventoryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string(),
  binNumber: z.string().optional(),
  rackNumber: z.string().optional(),
  platform: z.string().optional(),
  status: inventoryStatusSchema.optional(),
});
export type CreateInventoryItemRequest = z.infer<typeof createInventoryItemSchema>;
export type CreateInventoryItemResponse = InventoryItem;

// PATCH /api/inventory/:id - Update inventory item
export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  binNumber: z.string().min(1).optional(),
  rackNumber: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  status: inventoryStatusSchema.optional(),
  soldPrice: z.number().optional(),
  shipByDate: z.string().nullable().optional(),
  shipperQrCode: z.string().nullable().optional(),
});
export type UpdateInventoryItemRequest = z.infer<typeof updateInventoryItemSchema>;
export type UpdateInventoryItemResponse = InventoryItem;

// DELETE /api/inventory/:id - Delete inventory item
export const deleteInventoryItemResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteInventoryItemResponse = z.infer<typeof deleteInventoryItemResponseSchema>;

// POST /api/inventory/search - Search inventory by image (returns matching items)
export const searchInventoryRequestSchema = z.object({
  query: z.string().optional(),
  status: inventoryStatusSchema.optional(),
});
export type SearchInventoryRequest = z.infer<typeof searchInventoryRequestSchema>;
export type SearchInventoryResponse = InventoryItem[];

// POST /api/inventory/search-by-photo - Search inventory by photo
export const searchByPhotoRequestSchema = z.object({
  image: z.string(), // Base64 encoded image
  itemIds: z.array(z.string()), // Item IDs to search within
});
export type SearchByPhotoRequest = z.infer<typeof searchByPhotoRequestSchema>;

export const searchByPhotoResponseSchema = z.object({
  matchingItemIds: z.array(z.string()),
});
export type SearchByPhotoResponse = z.infer<typeof searchByPhotoResponseSchema>;

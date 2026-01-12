import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { type AppType } from "../types";
import { db } from "../db";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  searchInventoryRequestSchema,
  searchByPhotoRequestSchema,
  type InventoryItem,
  type GetInventoryResponse,
  type DeleteInventoryItemResponse,
  type SearchByPhotoResponse,
} from "@/shared/contracts";

const inventoryRouter = new Hono<AppType>();

// Helper to convert Prisma item to API response format
const formatItem = (item: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  binNumber: string;
  rackNumber: string;
  platform: string;
  status: string;
  soldAt: Date | null;
  soldPrice: number | null;
  shipByDate: Date | null;
  shipperQrCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}): InventoryItem => ({
  id: item.id,
  name: item.name,
  description: item.description,
  imageUrl: item.imageUrl,
  binNumber: item.binNumber,
  rackNumber: item.rackNumber,
  platform: item.platform,
  status: item.status as "pending" | "completed" | "sold",
  soldAt: item.soldAt?.toISOString() ?? null,
  soldPrice: item.soldPrice,
  shipByDate: item.shipByDate?.toISOString() ?? null,
  shipperQrCode: item.shipperQrCode,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

// GET /api/inventory - Get all inventory items with stats
inventoryRouter.get("/", async (c) => {
  console.log("📦 [Inventory] Fetching all inventory items");

  try {
    const items = await db.inventoryItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      completed: items.filter((i) => i.status === "completed").length,
      sold: items.filter((i) => i.status === "sold").length,
    };

    console.log(`✅ [Inventory] Found ${items.length} items`);

    return c.json({
      items: items.map(formatItem),
      stats,
    } satisfies GetInventoryResponse);
  } catch (error) {
    console.error("💥 [Inventory] Error fetching items:", error);
    return c.json({ error: "Failed to fetch inventory items" }, 500);
  }
});

// GET /api/inventory/:id - Get single inventory item
inventoryRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  console.log(`📦 [Inventory] Fetching item ${id}`);

  try {
    const item = await db.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      console.log(`❌ [Inventory] Item ${id} not found`);
      return c.json({ error: "Item not found" }, 404);
    }

    console.log(`✅ [Inventory] Found item ${id}`);
    return c.json(formatItem(item));
  } catch (error) {
    console.error("💥 [Inventory] Error fetching item:", error);
    return c.json({ error: "Failed to fetch inventory item" }, 500);
  }
});

// POST /api/inventory - Create new inventory item
inventoryRouter.post("/", zValidator("json", createInventoryItemSchema), async (c) => {
  const data = c.req.valid("json");
  console.log("📦 [Inventory] Creating new item:", data.name);

  try {
    const item = await db.inventoryItem.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        binNumber: data.binNumber ?? "",
        rackNumber: data.rackNumber ?? "",
        platform: data.platform ?? "",
        status: data.status ?? "pending",
      },
    });

    console.log(`✅ [Inventory] Created item ${item.id}`);
    return c.json(formatItem(item), 201);
  } catch (error) {
    console.error("💥 [Inventory] Error creating item:", error);
    return c.json({ error: "Failed to create inventory item" }, 500);
  }
});

// PATCH /api/inventory/:id - Update inventory item
inventoryRouter.patch("/:id", zValidator("json", updateInventoryItemSchema), async (c) => {
  const { id } = c.req.param();
  const data = c.req.valid("json");
  console.log(`📦 [Inventory] Updating item ${id}`);

  try {
    const existing = await db.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      console.log(`❌ [Inventory] Item ${id} not found`);
      return c.json({ error: "Item not found" }, 404);
    }

    // If status is being changed to "sold", set soldAt
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "sold" && existing.status !== "sold") {
      updateData.soldAt = new Date();
    }

    // Handle shipByDate - convert string to Date or null
    if (data.shipByDate !== undefined) {
      updateData.shipByDate = data.shipByDate ? new Date(data.shipByDate) : null;
    }

    const item = await db.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ [Inventory] Updated item ${id}`);
    return c.json(formatItem(item));
  } catch (error) {
    console.error("💥 [Inventory] Error updating item:", error);
    return c.json({ error: "Failed to update inventory item" }, 500);
  }
});

// DELETE /api/inventory/:id - Delete inventory item
inventoryRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();
  console.log(`📦 [Inventory] Deleting item ${id}`);

  try {
    const existing = await db.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      console.log(`❌ [Inventory] Item ${id} not found`);
      return c.json({ error: "Item not found" }, 404);
    }

    await db.inventoryItem.delete({
      where: { id },
    });

    console.log(`✅ [Inventory] Deleted item ${id}`);
    return c.json({
      success: true,
      message: "Item deleted successfully",
    } satisfies DeleteInventoryItemResponse);
  } catch (error) {
    console.error("💥 [Inventory] Error deleting item:", error);
    return c.json({ error: "Failed to delete inventory item" }, 500);
  }
});

// POST /api/inventory/search - Search inventory items
inventoryRouter.post("/search", zValidator("json", searchInventoryRequestSchema), async (c) => {
  const { query, status } = c.req.valid("json");
  console.log(`📦 [Inventory] Searching items with query: ${query}, status: ${status}`);

  try {
    const items = await db.inventoryItem.findMany({
      where: {
        AND: [
          status ? { status } : {},
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { description: { contains: query } },
                  { binNumber: { contains: query } },
                  { rackNumber: { contains: query } },
                  { platform: { contains: query } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ [Inventory] Found ${items.length} matching items`);
    return c.json(items.map(formatItem));
  } catch (error) {
    console.error("💥 [Inventory] Error searching items:", error);
    return c.json({ error: "Failed to search inventory items" }, 500);
  }
});

// POST /api/inventory/search-by-photo - Search inventory by photo
inventoryRouter.post("/search-by-photo", zValidator("json", searchByPhotoRequestSchema), async (c) => {
  const { image, itemIds } = c.req.valid("json");
  console.log(`📷 [Inventory] Photo search for ${itemIds.length} items`);

  try {
    // Get all items that match the provided IDs
    const items = await db.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
      },
    });

    if (items.length === 0) {
      return c.json({ matchingItemIds: [] } satisfies SearchByPhotoResponse);
    }

    // For now, implement a simple text-based search
    // In a production app, this would use an AI vision model to compare images
    // Here we'll return all items as potential matches since we don't have
    // vision AI set up - the user can manually identify their item

    // For a better experience, let's try to use the item names/descriptions
    // to help narrow down based on any text the user might have in the photo

    // Return all items sorted by most recent
    const matchingItemIds = items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(item => item.id);

    console.log(`✅ [Inventory] Photo search found ${matchingItemIds.length} potential matches`);
    return c.json({ matchingItemIds } satisfies SearchByPhotoResponse);
  } catch (error) {
    console.error("💥 [Inventory] Error in photo search:", error);
    return c.json({ error: "Failed to search by photo" }, 500);
  }
});

export { inventoryRouter };

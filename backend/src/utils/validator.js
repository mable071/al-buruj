import { z } from "zod";

export const loginSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1)
});

export const addProductSchema = z.object({
	product_name: z.string().min(1),
	unit: z.string().min(1).max(32).optional(),
	description: z.string().max(512).optional()
});

export const productInSchema = z.object({
	product_id: z.number().int().positive(),
	quantity_in: z.number().int().positive(),
	received_by: z.string().min(1),
	supplier: z.string().max(255).optional(),
	comment: z.string().max(1000).optional()
});

export const productOutSchema = z.object({
	product_id: z.number().int().positive(),
	quantity_out: z.number().int().positive(),
	issued_by: z.string().min(1),
	purpose: z.string().max(256).optional()
});



import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import type { ApiResponse, Product } from '@/types';

const productSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  reorderLevel: z.number().int().min(0).default(10),
  variants: z.array(z.object({
    sku: z.string().min(1),
    size: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    additionalCost: z.number().default(0),
    stockQuantity: z.number().int().min(0).default(0),
  })).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).optional(),
  initialStock: z.number().int().min(0).default(0),
  branchId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }

    const { barcode, name, description, categoryId, costPrice, sellingPrice, reorderLevel, variants, images, initialStock, branchId } = validation.data;

    const product = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { barcode } });
      if (existing) throw new Error('Product with this barcode already exists');

      const newProduct = await tx.product.create({
        data: {
          barcode,
          name,
          description,
          categoryId,
          costPrice,
          sellingPrice,
          reorderLevel,
          variants: variants?.length ? {
            create: variants,
          } : undefined,
          images: images?.length ? {
            create: images,
          } : undefined,
          inventory: {
            create: {
              branchId,
              quantity: initialStock,
            },
          },
        },
        include: {
          variants: true,
          images: true,
          inventory: true,
          category: true,
        },
      });

      return newProduct;
    });

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product as unknown as Product,
      message: 'Product created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const branchId = searchParams.get('branchId');
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
          images: true,
          category: { select: { name: true } },
          inventory: branchId ? {
            where: { branchId },
          } : true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    let filteredProducts = products;
    if (lowStock && branchId) {
      filteredProducts = products.filter(p => {
        const inv = p.inventory.find(i => i.branchId === branchId);
        return inv && inv.quantity <= p.reorderLevel;
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        items: filteredProducts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch products',
    }, { status: 500 });
  }
}

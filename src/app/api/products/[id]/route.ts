import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import type { ApiResponse, Product } from '@/types';

const updateSchema = z.object({
  barcode: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  reorderLevel: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        images: true,
        category: true,
        inventory: { include: { branch: true } },
      },
    });

    if (!product) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product as unknown as Product,
    });
  } catch (error) {
    console.error('Fetch product error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
      include: {
        variants: true,
        images: true,
        category: true,
        inventory: true,
      },
    });

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: product as unknown as Product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Update product error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}

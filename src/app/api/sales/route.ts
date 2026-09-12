import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils';
import type { ApiResponse, Sale } from '@/types';

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1, 'Cart must have at least one item'),
  paymentMethod: z.enum(['CASH', 'GCASH', 'PAYMAYA', 'CARD']),
  amountTendered: z.number().optional(),
  discountAmount: z.number().min(0).default(0),
  branchId: z.string().min(1),
  cashierId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: validation.error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }

    const { items, paymentMethod, amountTendered, discountAmount, branchId, cashierId } = validation.data;

    if (paymentMethod === 'CASH' && (!amountTendered || amountTendered <= 0)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Amount tendered is required for cash payments',
      }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = subtotal * 0.12;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const changeGiven = paymentMethod === 'CASH' && amountTendered
      ? amountTendered - totalAmount
      : null;

    if (paymentMethod === 'CASH' && changeGiven !== null && changeGiven < 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Insufficient amount tendered',
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const inventory = await tx.inventory.findUnique({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId: branchId,
              },
            },
            include: { product: true },
          });
          return { item, inventory };
        })
      );

      const errors: string[] = [];
      for (const { item, inventory } of stockChecks) {
        if (!inventory) {
          errors.push(`Product ${item.productId} not found in branch inventory`);
        } else if (inventory.quantity < item.quantity) {
          errors.push(`Insufficient stock for ${inventory.product.name}: available ${inventory.quantity}, requested ${item.quantity}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      const sale = await tx.sale.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          cashierId,
          branchId,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          paymentMethod,
          amountTendered: amountTendered || null,
          changeGiven,
          items: {
            create: items.map((item) => {
              const inv = stockChecks.find(s => s.item.productId === item.productId);
              return {
                productId: item.productId,
                productName: inv?.inventory.product.name || 'Unknown',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * item.quantity,
              };
            }),
          },
        },
        include: {
          items: true,
          cashier: { select: { name: true } },
          branch: { select: { locationName: true } },
        },
      });

      await Promise.all(
        items.map((item) =>
          tx.inventory.update({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId: branchId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          })
        )
      );

      return sale;
    });

    return NextResponse.json<ApiResponse<Sale>>({
      success: true,
      data: result as unknown as Sale,
      message: 'Transaction completed successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Transaction failed';
    return NextResponse.json<ApiResponse>({
      success: false,
      error: message,
    }, { status: 400 });
  }
}

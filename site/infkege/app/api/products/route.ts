// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductsService } from '@/lib/services/products.service';

// GET /api/products — get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let products;
    
    if (type === 'courses') {
      products = ProductsService.getAllCourses();
    } else if (type === 'paid') {
      products = ProductsService.getPaidCourses();
    } else if (type === 'free') {
      products = ProductsService.getFreeCourses();
    } else {
      products = ProductsService.getAllProducts();
    }

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        thumbnailUrl: p.thumbnailUrl,
        // Course-specific fields
        ...('slug' in p && { slug: p.slug }),
        ...('subtitle' in p && { subtitle: p.subtitle }),
        ...('features' in p && { features: p.features }),
        ...('purchaseOptions' in p && { purchaseOptions: p.purchaseOptions }),
        // Package-specific fields
        ...('variantRange' in p && { variantRange: p.variantRange }),
        ...('courseSlug' in p && { courseSlug: p.courseSlug }),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { ProductsService } from '@/lib/services/products.service';
import { checkAdminAccess } from '@/lib/dao';

// GET /api/admin/products - Get all products for admin
export async function GET() {
  // Используем централизованную проверку админа (DAL паттерн)
  const { isAdmin, error } = await checkAdminAccess();
  if (!isAdmin) return error!;

  try {
    const courses = ProductsService.getAllCourses();
    
    // Format for admin UI
    const products = courses.map(course => {
      const packages = ProductsService.getCoursePackages(course.id);
      const bulk = ProductsService.getCourseBulkPurchase(course.id);
      
      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        price: course.price,
        type: 'course',
        packages: [
          ...packages.map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            price: pkg.price,
          })),
          ...(bulk ? [{
            id: bulk.id,
            title: bulk.title,
            price: bulk.price,
          }] : []),
        ],
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[API /admin/products] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

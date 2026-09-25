import { Public } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Get } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { prisma } from '@/server/src/infrastructure/prisma';

@Public()
@Controller('departments')
export class DepartmentsController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET() {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return Response.json({ departments });

  }
}

import { Bind, Controller, Get } from '@nestjs/common';
import { AdminOnly } from '../auth/auth.decorators';
import { getCurrentUser } from '../auth/request-user';
import { WebRequest } from '../http/web-request';
import { getHomeData } from '@/server/src/queries/home';
import { getActivityData } from '../queries/activity';
import { getBookmarksData } from '../queries/bookmarks';
import { getSearchData } from '../queries/search';
import { getAdminDashboard } from '../queries/admin-dashboard';
import { getAuditLogs } from '../queries/audit-logs';
import { prisma } from '@/server/src/infrastructure/prisma';

const query = (request: Request) => Object.fromEntries(new URL(request.url).searchParams);

@Controller()
export class PagesController {
  @Get('home')
  async home() { return getHomeData(); }

  @Get('activity')
  async activity() { return getActivityData((await getCurrentUser())!); }

  @Get('bookmarks')
  async bookmarks() { return getBookmarksData((await getCurrentUser())!); }

  @Get('search')
  @Bind(WebRequest())
  async search(request: Request) { return getSearchData(query(request), (await getCurrentUser())!); }

  @AdminOnly()
  @Get('admin/dashboard')
  @Bind(WebRequest())
  async dashboard(request: Request) { return getAdminDashboard(query(request), (await getCurrentUser())!); }

  @AdminOnly()
  @Get('admin/settings')
  async settings() {
    return { departments: await prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, _count: { select: { members: true } } } }) };
  }

  @AdminOnly()
  @Get('admin/audit-logs')
  @Bind(WebRequest())
  async auditLogs(request: Request) { return getAuditLogs(query(request)); }

  @Get('auth/check')
  check() { return { authenticated: true }; }
}

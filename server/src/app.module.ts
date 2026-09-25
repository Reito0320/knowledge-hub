import { DatabaseLifecycle } from './infrastructure/database-lifecycle';
import { HealthController } from './controllers/health.controller';
import { PagesController } from './controllers/pages.controller';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { AdminDepartmentsDepartmentidController } from './controllers/admin/departments/[departmentId]/controller';
import { AdminDepartmentsController } from './controllers/admin/departments/controller';
import { AdminUsersUseridMfaRecoveryController } from './controllers/admin/users/[userId]/mfa-recovery/controller';
import { AdminUsersUseridRoleController } from './controllers/admin/users/[userId]/role/controller';
import { AdminUsersUseridSessionController } from './controllers/admin/users/[userId]/session/controller';
import { AdminUsersUseridStatusController } from './controllers/admin/users/[userId]/status/controller';
import { AuthSessionController } from './controllers/auth/session/controller';
import { DepartmentsController } from './controllers/departments/controller';
import { NotificationsController } from './controllers/notifications/controller';
import { PostPostidBookmarkController } from './controllers/post/[postId]/bookmark/controller';
import { PostPostidCommentsController } from './controllers/post/[postId]/comments/controller';
import { PostPostidLikeController } from './controllers/post/[postId]/like/controller';
import { PostPostidController } from './controllers/post/[postId]/controller';
import { PostImagesOwneridFilenameController } from './controllers/post/images/[ownerId]/[fileName]/controller';
import { PostImagesController } from './controllers/post/images/controller';
import { PostController } from './controllers/post/controller';
import { PostsSuggestionsController } from './controllers/posts/suggestions/controller';
import { TagsSuggestionsController } from './controllers/tags/suggestions/controller';
import { UsersUseridFavoriteController } from './controllers/users/[userId]/favorite/controller';
import { UsersProfileImageUploadController } from './controllers/users/profile/image-upload/controller';
import { UsersProfileController } from './controllers/users/profile/controller';
import { UsersProvisionController } from './controllers/users/provision/controller';
import { UsersSuggestionsController } from './controllers/users/suggestions/controller';

@Module({
  imports: [AuthModule],
  providers: [DatabaseLifecycle],
  controllers: [
    PagesController,
    HealthController,
    AdminDepartmentsDepartmentidController,
    AdminDepartmentsController,
    AdminUsersUseridMfaRecoveryController,
    AdminUsersUseridRoleController,
    AdminUsersUseridSessionController,
    AdminUsersUseridStatusController,
    AuthSessionController,
    DepartmentsController,
    NotificationsController,
    PostPostidBookmarkController,
    PostPostidCommentsController,
    PostPostidLikeController,
    PostPostidController,
    PostImagesOwneridFilenameController,
    PostImagesController,
    PostController,
    PostsSuggestionsController,
    TagsSuggestionsController,
    UsersUseridFavoriteController,
    UsersProfileImageUploadController,
    UsersProfileController,
    UsersProvisionController,
    UsersSuggestionsController,
  ]
})
export class AppModule { }

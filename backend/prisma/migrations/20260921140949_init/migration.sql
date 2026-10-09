-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_MODERATOR', 'YEARBOOK_ADMIN', 'STUDENT', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CrossInstitutionPolicy" AS ENUM ('OFF', 'CONNECTION_ONLY', 'MESSAGE_AFTER_CONNECTION', 'MESSAGE_WITHOUT_CONNECTION', 'FULL_INTERACTION');

-- CreateEnum
CREATE TYPE "AcademicSetKind" AS ENUM ('ADMISSION_COHORT', 'GRADUATION_COHORT', 'CLASS', 'DEPARTMENTAL', 'FACULTY', 'SCHOOL', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "SetStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'GRADUATED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "MessagePrivacy" AS ENUM ('NOBODY_EXCEPT_CONNECTIONS', 'SET_ONLY', 'INSTITUTION_ONLY', 'APPROVED_INSTITUTIONS', 'EVERYONE');

-- CreateEnum
CREATE TYPE "ProfilePrivacy" AS ENUM ('CONNECTIONS_ONLY', 'SET_ONLY', 'INSTITUTION_ONLY', 'EVERYONE');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'INSTITUTION', 'SET', 'CONNECTIONS');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'CELEBRATE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('PRIVATE', 'SET', 'INSTITUTION', 'CROSS_INSTITUTION', 'GROUP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'CONNECTION', 'COMMENT', 'LIKE', 'MENTION', 'SHARE', 'INSTITUTION_BROADCAST', 'YEARBOOK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BroadcastScope" AS ENUM ('ALL', 'SET', 'DEPARTMENT', 'FACULTY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "YearBookStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "YearBookSectionKind" AS ENUM ('FACULTY', 'DEPARTMENT', 'EVENTS', 'ACHIEVEMENTS', 'MEMORIES');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('POST', 'COMMENT', 'PROFILE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "institutionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "colours" JSONB,
    "website" TEXT,
    "location" TEXT,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "crossInstitutionPolicy" "CrossInstitutionPolicy" NOT NULL DEFAULT 'CONNECTION_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT,
    "kind" "AcademicSetKind" NOT NULL DEFAULT 'ADMISSION_COHORT',
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "graduationYear" INTEGER,
    "status" "SetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "departmentId" TEXT,
    "facultyId" TEXT,
    "studentNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "profilePhotoUrl" TEXT,
    "coverPhotoUrl" TEXT,
    "bio" TEXT,
    "gender" TEXT,
    "location" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_privacy" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "whoCanMessage" "MessagePrivacy" NOT NULL DEFAULT 'INSTITUTION_ONLY',
    "whoCanViewProfile" "ProfilePrivacy" NOT NULL DEFAULT 'EVERYONE',
    "whoCanViewPosts" "ProfilePrivacy" NOT NULL DEFAULT 'INSTITUTION_ONLY',

    CONSTRAINT "student_privacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "body" TEXT,
    "images" JSONB,
    "linkUrl" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'INSTITUTION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scope" "BroadcastScope" NOT NULL DEFAULT 'ALL',
    "scopeIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_recipients" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "broadcast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_books" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "setId" TEXT,
    "year" INTEGER NOT NULL,
    "status" "YearBookStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImageUrl" TEXT,
    "welcomeMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "year_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_book_sections" (
    "id" TEXT NOT NULL,
    "yearBookId" TEXT NOT NULL,
    "kind" "YearBookSectionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "year_book_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_book_students" (
    "id" TEXT NOT NULL,
    "yearBookId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "quote" TEXT,

    CONSTRAINT "year_book_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_book_photos" (
    "id" TEXT NOT NULL,
    "yearBookId" TEXT NOT NULL,
    "sectionId" TEXT,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "year_book_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_book_contents" (
    "id" TEXT NOT NULL,
    "yearBookId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "year_book_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_code_key" ON "institutions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_institutionCode_key" ON "institutions"("institutionCode");

-- CreateIndex
CREATE INDEX "faculties_institutionId_idx" ON "faculties"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_institutionId_code_key" ON "faculties"("institutionId", "code");

-- CreateIndex
CREATE INDEX "departments_institutionId_idx" ON "departments"("institutionId");

-- CreateIndex
CREATE INDEX "departments_facultyId_idx" ON "departments"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_institutionId_code_key" ON "departments"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sets_code_key" ON "academic_sets"("code");

-- CreateIndex
CREATE INDEX "academic_sets_institutionId_idx" ON "academic_sets"("institutionId");

-- CreateIndex
CREATE INDEX "academic_sets_departmentId_idx" ON "academic_sets"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_code_key" ON "students"("code");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_institutionId_idx" ON "students"("institutionId");

-- CreateIndex
CREATE INDEX "students_setId_idx" ON "students"("setId");

-- CreateIndex
CREATE INDEX "students_departmentId_idx" ON "students"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_institutionId_studentNumber_key" ON "students"("institutionId", "studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "student_privacy_studentId_key" ON "student_privacy"("studentId");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_institutionId_createdAt_idx" ON "posts"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_parentCommentId_idx" ON "comments"("parentCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_postId_studentId_key" ON "reactions"("postId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_commentId_studentId_key" ON "reactions"("commentId", "studentId");

-- CreateIndex
CREATE INDEX "connections_addresseeId_idx" ON "connections"("addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "connections_requesterId_addresseeId_key" ON "connections"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "conversation_participants_studentId_idx" ON "conversation_participants"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_studentId_key" ON "conversation_participants"("conversationId", "studentId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_idx" ON "notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "broadcasts_institutionId_idx" ON "broadcasts"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_recipients_broadcastId_studentId_key" ON "broadcast_recipients"("broadcastId", "studentId");

-- CreateIndex
CREATE INDEX "year_books_institutionId_idx" ON "year_books"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "year_books_institutionId_year_setId_key" ON "year_books"("institutionId", "year", "setId");

-- CreateIndex
CREATE INDEX "year_book_sections_yearBookId_idx" ON "year_book_sections"("yearBookId");

-- CreateIndex
CREATE INDEX "year_book_students_institutionId_idx" ON "year_book_students"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "year_book_students_yearBookId_studentId_key" ON "year_book_students"("yearBookId", "studentId");

-- CreateIndex
CREATE INDEX "year_book_photos_yearBookId_idx" ON "year_book_photos"("yearBookId");

-- CreateIndex
CREATE INDEX "year_book_contents_sectionId_idx" ON "year_book_contents"("sectionId");

-- CreateIndex
CREATE INDEX "audit_logs_institutionId_idx" ON "audit_logs"("institutionId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_sets" ADD CONSTRAINT "academic_sets_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_sets" ADD CONSTRAINT "academic_sets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_setId_fkey" FOREIGN KEY ("setId") REFERENCES "academic_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_privacy" ADD CONSTRAINT "student_privacy_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_books" ADD CONSTRAINT "year_books_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_books" ADD CONSTRAINT "year_books_setId_fkey" FOREIGN KEY ("setId") REFERENCES "academic_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_sections" ADD CONSTRAINT "year_book_sections_yearBookId_fkey" FOREIGN KEY ("yearBookId") REFERENCES "year_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_students" ADD CONSTRAINT "year_book_students_yearBookId_fkey" FOREIGN KEY ("yearBookId") REFERENCES "year_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_students" ADD CONSTRAINT "year_book_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_photos" ADD CONSTRAINT "year_book_photos_yearBookId_fkey" FOREIGN KEY ("yearBookId") REFERENCES "year_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_photos" ADD CONSTRAINT "year_book_photos_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "year_book_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "year_book_contents" ADD CONSTRAINT "year_book_contents_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "year_book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

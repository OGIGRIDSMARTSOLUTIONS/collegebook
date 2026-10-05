const prisma = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const { canViewPost } = require('./permission.service');

async function savePost(studentContext, postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { id: true, institutionId: true, setId: true } } },
  });
  if (!post) throw new ApiError('Post not found', 404);

  const viewer = { id: studentContext.studentId, institutionId: studentContext.institutionId, setId: studentContext.setId };
  const allowed = await canViewPost(viewer, post, post.author);
  if (!allowed) throw new ApiError('You cannot save this post', 403);

  const existing = await prisma.savedPost.findUnique({
    where: { studentId_postId: { studentId: studentContext.studentId, postId } },
  });
  if (existing) return existing;

  return prisma.savedPost.create({ data: { studentId: studentContext.studentId, postId } });
}

async function unsavePost(studentId, postId) {
  const existing = await prisma.savedPost.findUnique({ where: { studentId_postId: { studentId, postId } } });
  if (!existing) throw new ApiError('Not saved', 404);
  await prisma.savedPost.delete({ where: { id: existing.id } });
  return { unsaved: true };
}

async function listSavedPosts(studentId) {
  const saved = await prisma.savedPost.findMany({
    where: { studentId },
    include: {
      post: {
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return saved.filter((s) => !s.post.deletedAt).map((s) => s.post);
}

module.exports = { savePost, unsavePost, listSavedPosts };

const postService = require('../services/post.service');
const connectionService = require('../services/connection.service');
const { getIO } = require('../websocket/socket');
const { ok, created } = require('../utils/apiResponse');

/**
 * notifyFeedSubscribers — a lightweight "something changed, go refetch"
 * nudge, NOT a data push. The socket payload only ever carries a postId,
 * never the post content — clients respond to it by invalidating their
 * feed query and re-fetching through GET /posts/feed, which is where the
 * real, already-audited canViewPost() visibility logic runs. This means
 * the socket layer can never leak a post to someone who shouldn't see it,
 * no matter how the room targeting below is scoped, because the actual
 * content only ever flows back out through the permission-checked REST
 * path — the socket event carries no content to leak in the first place.
 *
 * Room targeting is a cheap, deliberately approximate superset per
 * visibility, not a re-implementation of canViewPost():
 *   PUBLIC       -> everyone connected (correct: PUBLIC is visible to all)
 *   INSTITUTION  -> the author's institution room
 *   SET          -> also the author's institution room (a superset —
 *                   some recipients will refetch and see nothing new,
 *                   which is harmless and matches normal feed filtering)
 *   CONNECTIONS  -> each accepted connection's personal room individually
 *
 * Group posts (post.groupId set) are deliberately NOT nudged here — group
 * membership isn't tracked as a Socket.IO room, and the main feed/this
 * event both scope to the non-group feed only.
 */
async function notifyFeedSubscribers(post) {
  const io = getIO();
  if (!io || post.groupId) return;

  const payload = { postId: post.id };

  if (post.visibility === 'PUBLIC') {
    io.emit('feed:new-post', payload);
  } else if (post.visibility === 'INSTITUTION' || post.visibility === 'SET') {
    io.to(`institution:${post.institutionId}`).emit('feed:new-post', payload);
  } else if (post.visibility === 'CONNECTIONS') {
    const connections = await connectionService.listConnections(post.authorId);
    connections.forEach((c) => io.to(`student:${c.id}`).emit('feed:new-post', payload));
  }
}

async function createPostHandler(req, res, next) {
  try {
    const post = await postService.createPost(req.context, req.body);
    // Best-effort — a failure here must never turn an already-successful
    // post creation into a 500 for the author.
    try {
      await notifyFeedSubscribers(post);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('feed:new-post notification failed (post was still created):', err.message);
    }
    return created(res, post);
  } catch (err) {
    next(err);
  }
}

async function getPostHandler(req, res, next) {
  try {
    const post = await postService.getPostOrThrow(req.params.id, req.context);
    return ok(res, post);
  } catch (err) {
    next(err);
  }
}

async function deletePostHandler(req, res, next) {
  try {
    const result = await postService.deletePost(req.context, req.params.id);
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function getFeedHandler(req, res, next) {
  try {
    const feed = await postService.getFeed(req.context, req.query);
    return ok(res, feed);
  } catch (err) {
    next(err);
  }
}

async function listStudentPostsHandler(req, res, next) {
  try {
    const posts = await postService.listStudentPosts(req.params.id, req.context, req.query);
    return ok(res, posts);
  } catch (err) {
    next(err);
  }
}

async function createCommentHandler(req, res, next) {
  try {
    const comment = await postService.createComment(req.context, req.params.id, req.body);
    return created(res, comment);
  } catch (err) {
    next(err);
  }
}

async function listCommentsHandler(req, res, next) {
  try {
    const comments = await postService.listComments(req.params.id, req.context);
    return ok(res, comments);
  } catch (err) {
    next(err);
  }
}

async function reactToPostHandler(req, res, next) {
  try {
    const result = await postService.toggleReaction(
      req.context.studentId,
      { postId: req.params.id },
      req.body.type
    );
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

async function reactToCommentHandler(req, res, next) {
  try {
    const result = await postService.toggleReaction(
      req.context.studentId,
      { commentId: req.params.id },
      req.body.type
    );
    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPostHandler,
  getPostHandler,
  deletePostHandler,
  getFeedHandler,
  listStudentPostsHandler,
  createCommentHandler,
  listCommentsHandler,
  reactToPostHandler,
  reactToCommentHandler,
};

CREATE TABLE "message_mentions" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "startOffset" INTEGER NOT NULL,
  "endOffset" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_mentions_messageId_studentId_startOffset_key"
  ON "message_mentions"("messageId", "studentId", "startOffset");

CREATE INDEX "message_mentions_studentId_createdAt_idx"
  ON "message_mentions"("studentId", "createdAt");

ALTER TABLE "message_mentions"
  ADD CONSTRAINT "message_mentions_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "message_mentions"
  ADD CONSTRAINT "message_mentions_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

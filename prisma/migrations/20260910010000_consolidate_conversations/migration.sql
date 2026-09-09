-- 1. Consolidate duplicate Conversations into a single primary Conversation per (customerId, companionUserId) pair
DO $$
DECLARE
    rec RECORD;
    primary_id TEXT;
BEGIN
    FOR rec IN
        SELECT "customerId", "companionUserId", MIN("createdAt") as min_created
        FROM "Conversation"
        GROUP BY "customerId", "companionUserId"
        HAVING COUNT(*) > 1
    LOOP
        -- Find the primary conversation ID (earliest created)
        SELECT id INTO primary_id
        FROM "Conversation"
        WHERE "customerId" = rec."customerId"
          AND "companionUserId" = rec."companionUserId"
        ORDER BY "createdAt" ASC
        LIMIT 1;

        -- Point all messages from duplicate conversations to the primary conversation
        UPDATE "Message"
        SET "conversationId" = primary_id
        WHERE "conversationId" IN (
            SELECT id FROM "Conversation"
            WHERE "customerId" = rec."customerId"
              AND "companionUserId" = rec."companionUserId"
              AND id != primary_id
        );

        -- Delete duplicate conversations
        DELETE FROM "Conversation"
        WHERE "customerId" = rec."customerId"
          AND "companionUserId" = rec."companionUserId"
          AND id != primary_id;
    END LOOP;
END $$;

-- 2. Drop unique index on bookingId if exists
DROP INDEX IF EXISTS "Conversation_bookingId_key";
DROP INDEX IF EXISTS "Conversation_customerId_companionUserId_bookingId_key";

-- 3. Drop column bookingId from Conversation if exists
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "bookingId";

-- 4. Create unique index on (customerId, companionUserId)
CREATE UNIQUE INDEX "Conversation_customerId_companionUserId_key" ON "Conversation"("customerId", "companionUserId");


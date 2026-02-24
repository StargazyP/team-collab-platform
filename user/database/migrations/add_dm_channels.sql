ALTER TABLE channels
  ADD COLUMN isDM TINYINT(1) NOT NULL DEFAULT 0 AFTER isPrivate,
  ADD COLUMN dmUser1Id BIGINT NULL AFTER isDM,
  ADD COLUMN dmUser2Id BIGINT NULL AFTER dmUser1Id;

CREATE INDEX idx_dm_users ON channels (workspaceId, dmUser1Id, dmUser2Id);

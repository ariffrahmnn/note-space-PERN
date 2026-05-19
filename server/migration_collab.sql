-- 1. Tabel kolaborasi notes
CREATE TABLE IF NOT EXISTS note_collaborators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  status      VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (note_id, invitee_id)
);

-- 2. Tabel notifikasi in-app
CREATE TABLE IF NOT EXISTS notifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 VARCHAR(30) NOT NULL,  -- 'collab_invite', 'collab_accepted', 'collab_rejected'
  note_collaborator_id UUID REFERENCES note_collaborators(id) ON DELETE CASCADE,
  message              TEXT NOT NULL,
  is_read              BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Kolom enkripsi di tabel notes (tambahkan jika belum ada)
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- 4. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_collab_note_id      ON note_collaborators(note_id);
CREATE INDEX IF NOT EXISTS idx_collab_invitee_id   ON note_collaborators(invitee_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipient_id  ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read       ON notifications(recipient_id, is_read);

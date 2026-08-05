import mongoose from 'mongoose'

export interface RefreshTokenDoc extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenDoc>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // SHA-256 of the signed refresh JWT, never the raw token itself — lets a
    // session be revoked (logout, password change, deactivation) without
    // relying solely on the JWT's own expiry, while a leaked DB dump alone
    // can't be replayed as a working refresh token.
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

// MongoDB TTL cleanup once a token's own expiry passes. Keyed off expiresAt
// rather than revokedAt — revoked-but-not-yet-expired rows still need to
// exist so a reused, already-rotated refresh token can be recognized and
// rejected instead of just "not found".
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema)

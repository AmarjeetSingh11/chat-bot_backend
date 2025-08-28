import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	token: {
		type: String,
		required: true,
		unique: true
	},
	deviceInfo: {
		userAgent: String,
		ip: String
	},
	isRevoked: {
		type: Boolean,
		default: false
	},
	expiresAt: {
		type: Date,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true
});

// Indexes for faster queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
// Unique index on token is already created via the schema field (unique: true)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);

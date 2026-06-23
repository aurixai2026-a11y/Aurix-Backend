const UserModel = require("../models/UserModel");

async function getUser(req, res) {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "User ID is required" });
		}

		const user = await UserModel.getUserById(id);

		if (!user) return res.status(404).json({ error: "User not found" });

		// Do not expose password_hash
		const { password_hash, ...safe } = user;

		return res.json({ user: safe });
	} catch (error) {
		console.error("Get user error:", error);
		return res.status(500).json({ error: "Failed to get user" });
	}
}

module.exports = {
	getUser
};

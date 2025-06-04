import User from "../models/User.js";

// Get all creators
export const getCreators = async (req, res) => {
  try {
    const creators = await User.find({ role: "creator" }).select("-__v");
    res.status(200).json(creators);
  } catch (error) {
    console.error("Error fetching creators:", error);
    res.status(500).json({ message: "Server error while fetching creators." });
  }
};

// Get all brands
export const getBrands = async (req, res) => {
  try {
    const brands = await User.find({ role: "brand" }).select("-__v");
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ message: "Server error while fetching brands." });
  }
};

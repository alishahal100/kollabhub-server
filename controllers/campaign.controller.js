import Campaign from "../models/Campaigns.js";
import User from "../models/User.js";
// Get all active campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// Get campaigns by specific brand (public route)
export const getCampaignsByBrand = async (req, res) => {
  try {
    const { userId } = req.params;
    const campaigns = await Campaign.find({ brandId: userId });
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching brand campaigns:", error);
    return res.status(500).json({ message: "Failed to fetch brand campaigns" });
  }
};

// Get campaigns for authenticated brand
export const getBrandCampaigns = async (req, res) => {
  try {
    const brandId = req.userId;
    const campaigns = await Campaign.find({ brandId }).sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching authenticated brand's campaigns:", error);
    return res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

// Create a new campaign
export const createCampaign = async (req, res) => {
  try {
    const {
      title, description, budget,
      category, deliverables, applicationDeadline, brandId
    } = req.body;

    const campaign = await Campaign.create({
      brandId,
      title,
      description,
      budget,
      category,
      deliverables,
      applicationDeadline
    });

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({
      message: "Failed to create campaign",
      error: error.message
    });
  }
};

// Creator applies to a campaign
export const applyToCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const creatorId = req.userId;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        $push: {
          applications: {
            creatorId,
            status: 'pending',
            appliedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.status(200).json({
      message: "Application submitted successfully",
      campaign
    });
  } catch (error) {
    console.error("Error applying to campaign:", error);
    return res.status(500).json({
      message: "Failed to apply to campaign",
      error: error.message
    });
  }
};

// Get campaigns a creator has applied to
export const getAppliedCampaigns = async (req, res) => {
  try {
    const creatorId = req.userId;
    const campaigns = await Campaign.find({ "applications.creatorId": creatorId });
    return res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching applied campaigns:", error);
    return res.status(500).json({ message: "Failed to fetch applied campaigns" });
  }
};

// Update a campaign
export const updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ message: "Failed to update campaign", error: error.message });
  }
};

// Update application status (accept/reject)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { campaignId, creatorId ,status} = req.params;
    

    const campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, "applications.creatorId": creatorId },
      { $set: { "applications.$.status": status } },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: "Campaign or application not found" });
    }

    return res.status(200).json(campaign);
  } catch (error) {
    console.error("Error updating application status:", error);
    return res.status(500).json({ message: "Failed to update application status", error: error.message });
  }
};


// Get a specific campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Find the campaign by ID and populate the applications
    const campaign = await Campaign.findById(campaignId).lean();

    const creatorIds = campaign.applications.map(app => app.creatorId);
    const users = await User.find({ clerkUserId: { $in: creatorIds } }, 'clerkUserId creatorProfile');
    
    const userMap = Object.fromEntries(users.map(user => [user.clerkUserId, user.creatorProfile]));
    
    campaign.applications = campaign.applications.map(app => ({
      ...app,
      creatorProfile: userMap[app.creatorId] || null
    }));
    
    res.status(200).json(campaign);
  }
  catch (error) {
    console.error("Error fetching campaign by ID:", error);
    res.status(500).json({ message: "Failed to fetch campaign", error: error.message });
  }
}    

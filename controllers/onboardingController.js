import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import clerkClient from '@clerk/clerk-sdk-node';
const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: process.env.CLOUDINARY_FOLDER },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const handleOnboarding = async (req, res) => {
  console.log('Onboarding request:', req.body, req.files);

  try {
    const { clerkUserId, role, ...fields } = req.body;
    const files = req.files || {};

    const existingUser = await User.findOne({ clerkUserId });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already completed onboarding"
      });
    }

    let processedData = { clerkUserId, role };

    if (role === 'creator') {
      const portfolioUrls = await Promise.all(
        files.portfolio.map(file => uploadToCloudinary(file.buffer))
      );
      processedData.creatorProfile = {
        ...fields,
        portfolio: portfolioUrls,
        followers: parseInt(fields.followers) || 0
      };
    } else {
      const logoUrl = await uploadToCloudinary(files.logo[0].buffer);
      processedData.brandProfile = {
        ...fields,
        logo: logoUrl
      };
    }

    const newUser = new User(processedData);
    await newUser.save();

    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: { onboarded: true ,role: role },
    });

    res.status(201).json({
      success: true,
      data: {
        role,
        profile: role === 'creator' ? newUser.creatorProfile : newUser.brandProfile
      }
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during onboarding'
    });
  }
};

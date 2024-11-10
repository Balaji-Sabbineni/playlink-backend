const mongoose = require('mongoose');

const communityGroupSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default:
          `https://${process.env.S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/community_profiles/WhatsApp_icon.jpeg`,
      },
    groupLink: {
        type: String,
        required: true
    }
});

// Create CommunityGroup model
const CommunityGroup = mongoose.model('CommunityGroup', communityGroupSchema);
module.exports = CommunityGroup;

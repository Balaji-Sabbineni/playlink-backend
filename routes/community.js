const express = require("express");
const routes = express.Router();
const CommunityGroup = require("./../models/community");

// CommunityGroup routes
routes.post("/", async (req, res) => {
  try {
    const newCommunityGroup = new CommunityGroup(req.body);
    await newCommunityGroup.save();
    res.status(201).send(newCommunityGroup);
    console.log("Community group saved successfully");
  } catch (err) {
    res.status(400).send(err);
  }
});

routes.get("/", async (req, res) => {
  try {
    const communityGroups = await CommunityGroup.find({});
    res.status(200).send(communityGroups);
    console.log("Community group data fetch successfully");
  } catch (err) {
    res.status(400).send(err);
  }
});

routes.put("/:id", async (req, res) => {
  try {
    const communityGroupId = req.params.id;
    const updates = req.body;
    const options = { new: true };

    const updatedCommunityGroup = await CommunityGroup.findByIdAndUpdate(
      communityGroupId,
      updates,
      options
    );
    if (!updatedCommunityGroup) {
      return res.status(404).json({ error: "Community group not found" });
    }

    console.log("Community group updated successfully");
    res.status(200).json(updatedCommunityGroup);
  } catch (error) {
    console.log("Error updating community group", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

routes.delete("/:id", async (req, res) => {
  try {
    const communityGroupId = req.params.id;

    const deletedCommunityGroup = await CommunityGroup.findByIdAndDelete(
      communityGroupId
    );
    if (!deletedCommunityGroup) {
      return res.status(404).json({ error: "Community group not found" });
    }

    console.log("Community group deleted successfully");
    res.status(200).json({ message: "Community group deleted successfully" });
  } catch (error) {
    console.log("Error deleting community group", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = routes;
const mongoose = require('mongoose');
const Group = require('../models/groupModel');

// GET all groups (R - Read All)
const getAllGroups = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(200).json({ data: [] });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ data: [] });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const groups = await Group.find({
      $or: [{ owner: objectId }, { 'members.user': objectId }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ data: groups });
  } catch (e) {
    // Return 500 for server-side error (e.g., database connection issue)
    return res.status(500).json({ message: 'Failed to retrieve groups.', error: e.message });
  }
};

// GET group by ID (R - Read One)
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find group by ID and populate the owner field
    const group = await Group.findById(id).populate('owner', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({ data: group });
  } catch (e) {
    // Check for invalid ID format (e.g., if ID isn't a valid ObjectId)
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Group ID format.' });
    }
    res.status(500).json({ message: 'Error retrieving group.', error: e.message });
  }
};

// POST add new group (C - Create)
const addGroup = async (req, res) => {
  const { name, description, groupType, privacySetting, owner } = req.body;

  // Validation check for required fields
  if (!name || !description || !owner) {
    return res.status(400).json({
      message: 'Missing required fields: name, description, and owner (User ID).',
    });
  }

  try {
    const newGroup = await Group.create({
      name,
      description,
      groupType,
      privacySetting,
      owner,
      members: [
        {
          user: owner,
          role: 'Owner',
        },
      ],
    });

    // Fetch and populate the newly created group for the response
    const groupResponse = await Group.findById(newGroup._id)
      .populate('members.user', 'name email')
      .populate('owner', 'name email');

    res.status(201).json({
      message: 'Group created successfully',
      data: groupResponse,
    });
  } catch (e) {
    // Handle potential Mongoose validation or duplicate key errors
    res.status(400).json({
      message: 'Failed to create group due to validation error.',
      error: e.message,
    });
  }
};

// PATCH/PUT update group by ID (U - Update)
const updateGroup = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Optional: Basic validation to prevent updating with an empty body
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No fields provided for update.' });
  }

  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // 'new: true' returns the updated doc, 'runValidators: true' checks Mongoose schema rules
    ).populate('owner', 'name email');

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      message: 'Group updated successfully',
      data: updatedGroup,
    });
  } catch (e) {
    // Handle validation errors (e.g., trying to update name to an invalid value)
    if (e.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Group ID format.' });
    }
    res.status(400).json({
      message: 'Failed to update group due to validation error.',
      error: e.message,
    });
  }
};

// DELETE group by ID (D - Delete)
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({ message: 'Group deleted successfully', data: group });
  } catch (error) {
    // Handle potential errors like invalid ID format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Group ID format.' });
    }
    res.status(500).json({ message: 'Error deleting group.', error: error.message });
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  addGroup,
  updateGroup,
  deleteGroup,
};

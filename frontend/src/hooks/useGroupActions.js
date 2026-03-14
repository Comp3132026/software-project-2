import { groupsAPI, chatAPI } from '../utils/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function useGroupActions({
  group,
  reloadAll,
  navigate,
  id,
  progressText,
  setProgressText,
  user,
  setShowChat,
}) {
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showShareProgress, setShowShareProgress] = useState(false);
  const [deleting, setDeleting] = useState(false);

  //open Edit group Modal
  const handleEditGroupClick = () => {
    if (group?._id) {
      setShowEditGroup(true);
    }
  };
  
    const handleEditGroupSuccess = () => {
    setShowEditGroup(false);
    reloadAll();
  }; 

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      await groupsAPI.delete(id);
      toast.success('Group deleted!');
      navigate('/');
    } catch (e) {
      toast.error('Failed to delete group');
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  //edit group

    const handleEditGroupClose = () => {
    setShowEditGroup(false);
  };


  const handleShareProgress = async () => {
    if (!progressText.trim()) {
      return;
    }

    try {
      await chatAPI.send({
        groupId: group._id,
        sender: user._id,
        content: progressText,
        type: 'progress',
      });

      setProgressText(''); // clear text
      setShowShareProgress(false); // close modal
      toast.success('Share Progress succeeded');
      setShowChat(true); //open chat
    } catch (err) {
      console.log(err);
      toast.error('Failed to send progress:', err);
    }
  };

  return {
    showEditGroup,
    showDeleteConfirm,
    showLeaveModal,
    showShareProgress,
    deleting,
    setShowEditGroup,
    setShowDeleteConfirm,
    setShowLeaveModal,

    setShowShareProgress,
    handleEditGroupClick,
    handleEditGroupSuccess,
    handleEditGroupClose,

    handleDeleteGroup,
    handleShareProgress,
  };
}
